import type { MedusaContainer } from "@medusajs/framework";
import { SAGA_MODULE } from "../modules/saga";
import type SagaModuleService from "../modules/saga/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:sla-monitor");

// Thresholds
const SAGA_STUCK_MINUTES = 60; // Saga running more than 60 min → alert
const FULFILLMENT_DELAY_HOURS = 48; // Payment captured, no fulfillment > 48h → alert
const PAYOUT_PENDING_DAYS = 7; // Settlement not paid out > 7 days → alert
const RMA_PICKUP_STUCK_HOURS = 72; // RMA pickup scheduled but not collected > 72h → alert

export default async function slaMonitor(container: MedusaContainer) {
  const eventBus = container.resolve("event_bus") as any;
  const auditService = container.resolve("audit") as any;

  let sagaService: SagaModuleService | null = null;
  try {
    sagaService = container.resolve(SAGA_MODULE) as SagaModuleService;
  } catch {
    /* ok */
  }

  try {
    const now = new Date();
    const alerts: any[] = [];

    // ── 1. Stuck Sagas ────────────────────────────────────────────────────
    if (sagaService) {
      const stuckSagas = await sagaService.getStuckSagas(SAGA_STUCK_MINUTES);
      for (const saga of stuckSagas) {
        const minutesStuck = Math.floor(
          (now.getTime() - new Date(saga.created_at).getTime()) / 60000,
        );
        alerts.push({
          alert_type: "stuck_saga",
          entity_id: saga.id,
          entity_type: "saga_instance",
          message: `Saga ${saga.saga_type} (${saga.id}) stuck at step ${saga.current_step} for ${minutesStuck} min`,
          severity: "high",
          metadata: { saga_type: saga.saga_type, order_id: saga.order_id },
        });
        await eventBus.emit?.("ops.stuck_workflow", {
          workflow_type: "saga",
          workflow_id: saga.id,
          saga_type: saga.saga_type,
          order_id: saga.order_id,
          minutes_stuck: minutesStuck,
        });
      }
    }

    // ── 2. Payment captured but no fulfillment > 48h ───────────────────
    try {
      const orderModule = container.resolve("order") as any;
      const fulfillmentThreshold = new Date(
        now.getTime() - FULFILLMENT_DELAY_HOURS * 3600000,
      );
      const pendingOrders =
        (await orderModule.listOrders?.({
          status: ["pending"],
          payment_status: ["captured"],
        })) ?? [];
      for (const order of pendingOrders) {
        if (new Date(order.created_at) < fulfillmentThreshold) {
          const hoursWaiting = Math.floor(
            (now.getTime() - new Date(order.created_at).getTime()) / 3600000,
          );
          alerts.push({
            alert_type: "fulfillment_delayed",
            entity_id: order.id,
            entity_type: "order",
            message: `Order ${order.id} waiting ${hoursWaiting}h for fulfillment`,
            severity: "medium",
            metadata: { order_id: order.id, hours_waiting: hoursWaiting },
          });
          await eventBus.emit?.("ops.stuck_workflow", {
            workflow_type: "fulfillment_delay",
            order_id: order.id,
            hours_waiting: hoursWaiting,
          });
        }
      }
    } catch {
      /* order module optional */
    }

    // ── 3. RMA pickup stuck > 72h ─────────────────────────────────────
    try {
      const rmaService = container.resolve("rma") as any;
      const rmaThreshold = new Date(
        now.getTime() - RMA_PICKUP_STUCK_HOURS * 3600000,
      );
      const stuckRmas =
        (await rmaService.listReturnRequests?.({
          pickup_status: "scheduled",
        })) ?? [];
      for (const rma of stuckRmas) {
        if (
          new Date(rma.pickup_scheduled_at ?? rma.created_at) < rmaThreshold
        ) {
          alerts.push({
            alert_type: "rma_pickup_stuck",
            entity_id: rma.id,
            entity_type: "return_request",
            message: `RMA ${rma.id} pickup scheduled but not collected for > ${RMA_PICKUP_STUCK_HOURS}h`,
            severity: "medium",
            metadata: { return_request_id: rma.id, pickup_id: rma.pickup_id },
          });
          await eventBus.emit?.("ops.stuck_workflow", {
            workflow_type: "rma_pickup",
            return_request_id: rma.id,
          });
        }
      }
    } catch {
      /* rma module optional */
    }

    // ── Persist & log ────────────────────────────────────────────────────
    if (auditService?.createSlaAlerts) {
      for (const alert of alerts) {
        await auditService.createSlaAlerts(alert).catch(() => {});
      }
    }

    if (alerts.length > 0) {
      logger.warn(
        `SLA monitor: ${alerts.length} alert(s) — ${alerts.map((a) => a.alert_type).join(", ")}`,
      );
    } else {
      logger.info("SLA monitor: system healthy");
    }
  } catch (err) {
    logger.error(`SLA monitor error: ${String(err)}`);
  }
}

export const config = {
  name: "sla-monitor",
  schedule: "*/15 * * * *",
};
