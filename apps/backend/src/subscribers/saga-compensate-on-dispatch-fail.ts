import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { SAGA_MODULE } from "../modules/saga";
import type SagaModuleService from "../modules/saga/service";
import { SETTLEMENT_MODULE } from "../modules/settlement";
import type SettlementModuleService from "../modules/settlement/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:saga-compensate-on-dispatch-fail");

export default async function sagaCompensateOnDispatchFail({
  event,
  container,
}: SubscriberArgs<{
  order_id: string;
  fulfillment_id?: string;
  saga_id?: string;
  reason?: string;
}>) {
  const sagaService: SagaModuleService = container.resolve(SAGA_MODULE);
  const settlementService: SettlementModuleService =
    container.resolve(SETTLEMENT_MODULE);
  const eventBus = container.resolve("event_bus") as any;
  const {
    order_id,
    saga_id,
    reason = "fulfillment_dispatch_failed",
  } = event.data;

  // Find the running checkout saga for this order if saga_id not provided
  let saga: any = null;
  if (saga_id) {
    saga = await sagaService.retrieveSagaInstance(saga_id).catch(() => null);
  } else {
    const running = (await sagaService.listSagaInstances({
      order_id,
      status: "running",
    })) as any[];
    saga = running[0];
  }

  if (!saga) {
    logger.warn(
      `No running saga found for order ${order_id} — compensation skipped`,
    );
    return;
  }

  try {
    // 1. Trigger saga compensation (marks as compensating, logs rollback plan)
    const { stepsToCompensate } = await sagaService.compensate(saga.id, reason);
    logger.warn(
      `Compensating saga ${saga.id} for order ${order_id}: ${stepsToCompensate.length} steps`,
    );

    // 2. Execute compensation for each step in reverse
    for (const comp of stepsToCompensate) {
      switch (comp.compensation) {
        case "refund_payment": {
          // Emit refund request — payment provider handles
          await eventBus.emit?.("payment.refund_requested", {
            order_id,
            reason: "dispatch_failed",
            amount: comp.original_output?.captured_amount,
          });
          await sagaService.markCompensationStep(saga.id, comp.compensation, {
            status: "emitted",
          });
          break;
        }
        case "release_inventory": {
          // Emit inventory release
          await eventBus.emit?.("inventory.release_reservation_requested", {
            order_id,
          });
          await sagaService.markCompensationStep(saga.id, comp.compensation, {
            status: "emitted",
          });
          break;
        }
        case "cancel_fulfillment": {
          await eventBus.emit?.("fulfillment.cancel_requested", {
            order_id,
            fulfillment_id: comp.original_output?.fulfillment_id,
          });
          await sagaService.markCompensationStep(saga.id, comp.compensation, {
            status: "emitted",
          });
          break;
        }
        case "cancel_order": {
          await eventBus.emit?.("order.cancel_requested", {
            order_id,
            reason: "dispatch_failed",
          });
          await sagaService.markCompensationStep(saga.id, comp.compensation, {
            status: "emitted",
          });
          break;
        }
        default: {
          logger.warn(`No compensation handler for step: ${comp.compensation}`);
          await sagaService.markCompensationStep(saga.id, comp.compensation, {
            status: "skipped",
          });
        }
      }
    }

    // 3. Freeze settlement ledger during compensation
    await settlementService
      .updateSettlementLedgers({
        order_id,
        status: "frozen",
        freeze_reason: "saga_compensation",
      } as any)
      .catch(() => {});

    logger.info(`Saga ${saga.id} compensation complete — all steps emitted`);
  } catch (err) {
    logger.error(`Saga compensation error (${saga.id}): ${String(err)}`);
  }
}

export const config: SubscriberConfig = {
  event: ["fulfillment.dispatch_failed"],
};
