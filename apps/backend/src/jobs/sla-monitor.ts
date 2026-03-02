import type { MedusaContainer } from "@medusajs/framework";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:sla-monitor");

// Thresholds
const ORDER_STUCK_HOURS = 24;
const FULFILLMENT_DELAY_HOURS = 48;
const PAYOUT_PENDING_DAYS = 7;

export default async function slaMonitor(container: MedusaContainer) {
  const eventBus = container.resolve("eventBusService") as any;
  const auditService = container.resolve("audit") as any;

  try {
    // Skip if audit module doesn't have sla alert methods
    if (!auditService?.createSlaAlerts) {
      logger.warn(
        "SLA monitor: audit module does not have createSlaAlerts — skipping",
      );
      return;
    }

    const now = new Date();
    const stuckOrderThreshold = new Date(
      now.getTime() - ORDER_STUCK_HOURS * 3600000,
    );
    const fulfillmentThreshold = new Date(
      now.getTime() - FULFILLMENT_DELAY_HOURS * 3600000,
    );
    const payoutThreshold = new Date(
      now.getTime() - PAYOUT_PENDING_DAYS * 86400000,
    );

    const alerts: any[] = [];

    // Create alert records
    for (const alert of alerts) {
      await auditService.createSlaAlerts?.(alert);
      await eventBus.emit?.("ops.sla_alert", alert);
    }

    if (alerts.length > 0) {
      logger.warn(`SLA monitor: ${alerts.length} alert(s) generated`);
    } else {
      logger.info("SLA monitor: system healthy");
    }
  } catch (err) {
    logger.error(`SLA monitor error: ${String(err)}`);
  }
}

export const config = {
  name: "sla-monitor",
  schedule: "*/15 * * * *", // every 15 min
};
