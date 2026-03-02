import type { MedusaContainer } from "@medusajs/framework";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:recompute-vendor-risk");

const PAYOUT_HOLD_THRESHOLD = 80;
const REVIEW_THRESHOLD = 90;

export default async function recomputeVendorRisk(container: MedusaContainer) {
  const vendorService = container.resolve("vendor") as any;

  try {
    const vendors = await vendorService.listVendors?.({ is_active: true });
    if (!vendors || vendors.length === 0) return;

    for (const vendor of vendors) {
      const score = await computeScore(vendor, container);
      await vendorService.createVendorRiskScores?.({
        vendor_id: vendor.id,
        composite_score: score.total,
        cancellation_score: score.cancellation,
        sla_score: score.sla,
        refund_score: score.refund,
        fraud_score: score.fraud,
        computed_at: new Date(),
        auto_hold_triggered: score.total >= PAYOUT_HOLD_THRESHOLD,
      });

      if (score.total >= PAYOUT_HOLD_THRESHOLD) {
        logger.warn(
          `Vendor ${vendor.id} risk score ${score.total} — payout HELD`,
        );
      }
    }

    logger.info(`Vendor risk scores recomputed for ${vendors.length} vendors`);
  } catch (err) {
    logger.error(`Vendor risk recompute error: ${String(err)}`);
  }
}

async function computeScore(vendor: any, container: MedusaContainer) {
  // Placeholder scoring — in production pull from order/payout/sla records
  const cancellation = vendor.cancellation_rate
    ? vendor.cancellation_rate * 100 * 0.3
    : 0;
  const sla = vendor.sla_breach_rate ? vendor.sla_breach_rate * 100 * 0.3 : 0;
  const refund = vendor.refund_rate ? vendor.refund_rate * 100 * 0.25 : 0;
  const fraud = vendor.fraud_flags ? Math.min(vendor.fraud_flags * 5, 25) : 0;
  return {
    cancellation,
    sla,
    refund,
    fraud,
    total: Math.round(cancellation + sla + refund + fraud),
  };
}

export const config = {
  name: "recompute-vendor-risk",
  schedule: "0 3 * * *", // Daily at 3am
};
