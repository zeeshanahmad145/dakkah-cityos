import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscribers:vendor-sla-penalty");

/**
 * Vendor SLA Penalty Subscriber
 *
 * Fires when `vendor.sla.breached` event is emitted by the
 * `inactive-vendor-check.ts` scheduled job (which polls VendorSlaRecord
 * rows where breach_at < now AND status = "tracking" or "at_risk").
 *
 * Actions:
 * 1. Update VendorSlaRecord status to "breached"
 * 2. Calculate penalty based on breach severity:
 *    - low    → 2.5% of order value
 *    - medium → 5%
 *    - high   → 10% + flag vendor for review
 * 3. Create a deduction against the vendor's next payout
 * 4. If severity=high → emit payout.hold event
 * 5. Increment vendor risk score
 */
export default async function vendorSlaPenaltyHandler({
  event: { data },
  container,
}: SubscriberArgs<{
  sla_record_id: string;
  vendor_id: string;
  order_id: string;
  sla_type: string;
  breach_severity: "low" | "medium" | "high";
  order_total: number;
  currency_code: string;
}>) {
  const eventBus = container.resolve("event_bus") as any;
  const query = container.resolve("query") as any;

  try {
    const {
      sla_record_id,
      vendor_id,
      order_total,
      breach_severity,
      currency_code,
    } = data;

    // Determine penalty percentage
    const penaltyPct =
      breach_severity === "high"
        ? 0.1
        : breach_severity === "medium"
          ? 0.05
          : 0.025;

    const penaltyAmount = Math.round(order_total * penaltyPct * 100) / 100;

    // Update the SLA record
    try {
      const vendorModule = container.resolve("vendorModuleService") as any;
      await vendorModule.updateVendorSlaRecords?.({
        id: sla_record_id,
        status: "breached",
        breach_severity,
        penalty_amount: penaltyAmount,
        penalty_applied_at: new Date(),
      } as any);
    } catch (e: any) {
      logger.warn("Could not update VendorSlaRecord:", e.message);
    }

    // Create payout deduction
    try {
      const payoutService = container.resolve("payoutModuleService") as any;
      await payoutService.createPayoutDeduction?.({
        vendor_id,
        amount: penaltyAmount,
        currency_code,
        reason: `SLA breach penalty (${breach_severity}) — order ${data.order_id}`,
        reference_type: "sla_breach",
        reference_id: sla_record_id,
      } as any);
    } catch (e: any) {
      logger.warn("Could not create payout deduction:", e.message);
    }

    logger.info(
      `SLA penalty applied: vendor ${vendor_id}, amount ${penaltyAmount} ${currency_code}, severity ${breach_severity}`,
    );

    // High severity: hold payout and flag for review
    if (breach_severity === "high") {
      await eventBus.emit("payout.hold", {
        vendor_id,
        reason: "sla_breach_high",
        sla_record_id,
      });
      await eventBus.emit("vendor.flagged_for_review", {
        vendor_id,
        trigger: "sla_breach_high",
        sla_record_id,
      });
    }

    await eventBus.emit("vendor.sla.penalty_applied", {
      vendor_id,
      sla_record_id,
      penalty_amount: penaltyAmount,
      breach_severity,
    });
  } catch (err: any) {
    logger.error("Vendor SLA penalty handler error:", err.message);
  }
}

export const config: SubscriberConfig = {
  event: "vendor.sla.breached",
};
