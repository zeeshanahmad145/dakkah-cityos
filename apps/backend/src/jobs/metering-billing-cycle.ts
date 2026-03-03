import type { MedusaContainer } from "@medusajs/framework";
import { METERING_MODULE } from "../modules/metering";
import type MeteringModuleService from "../modules/metering/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:metering-billing-cycle");

// Cron: Daily at 03:00 UTC
export const config = { name: "metering-billing-cycle", schedule: "0 3 * * *" };

/**
 * Aggregates all unbilled usage events, creates metering period records,
 * and emits events so downstream order-creation flows can bill the customer.
 *
 * Order creation is delegated to a subscriber listening to "metering.period_closed"
 * to keep this job simple and testable.
 */
export default async function meteringBillingCycle(container: MedusaContainer) {
  const meteringService: MeteringModuleService =
    container.resolve(METERING_MODULE);
  const eventBus = container.resolve("event_bus") as any;

  try {
    const unbilledSummary = await meteringService.getUnbilledSummary();
    if (unbilledSummary.length === 0) {
      logger.info("Metering billing cycle: no unbilled usage events");
      return;
    }

    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - 1);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(now);
    periodEnd.setHours(0, 0, 0, 0);

    let billedCount = 0;
    for (const summary of unbilledSummary) {
      if (summary.total_amount <= 0) continue;

      // Create metering period record
      const period = await meteringService.createPeriod({
        customerId: summary.customer_id,
        resourceType: summary.resource_type,
        periodStart,
        periodEnd,
        totalUnits: summary.total_units,
        totalAmount: summary.total_amount,
        currencyCode: summary.currency_code,
      });

      // Mark events as billed
      await meteringService.markBilled(summary.event_ids, period.id);

      // Emit event → downstream subscriber creates an order for this customer
      await eventBus.emit?.("metering.period_closed", {
        period_id: period.id,
        customer_id: summary.customer_id,
        resource_type: summary.resource_type,
        total_amount: summary.total_amount,
        currency_code: summary.currency_code,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      });

      billedCount++;
    }

    logger.info(
      `Metering billing cycle: ${billedCount} periods closed and emitted`,
    );
  } catch (err) {
    logger.error(`Metering billing cycle error: ${String(err)}`);
  }
}
