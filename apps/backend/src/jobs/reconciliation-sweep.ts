import type { MedusaContainer } from "@medusajs/framework";
import { RECONCILIATION_MODULE } from "../modules/reconciliation";
import type ReconciliationModuleService from "../modules/reconciliation/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:reconciliation-sweep");

export default async function reconciliationSweep(container: MedusaContainer) {
  const reconciliationService: ReconciliationModuleService = container.resolve(
    RECONCILIATION_MODULE,
  );
  const eventBus = container.resolve("eventBusService") as any;

  try {
    const staleBatches = await reconciliationService.getStaleUnmatched(24);

    for (const batch of staleBatches) {
      await reconciliationService.updateReconciliationBatches({
        id: batch.id,
        status: "mismatched",
        mismatch_amount: batch.batch_amount,
        auto_held: true,
        hold_reason: "Stale unmatched after 24h sweep",
      } as any);

      await eventBus.emit?.("ops.sla_alert", {
        alert_type: "reconciliation_mismatch",
        batch_id: batch.id,
        batch_reference: batch.batch_reference,
        amount: batch.batch_amount,
        currency: batch.currency_code,
        age_hours: 24,
      });

      logger.warn(
        `Reconciliation sweep: batch ${batch.batch_reference} marked mismatched (SAR ${batch.batch_amount})`,
      );
    }

    logger.info(
      `Reconciliation sweep: ${staleBatches.length} stale batches processed`,
    );
  } catch (err) {
    logger.error(`Reconciliation sweep error: ${String(err)}`);
  }
}

export const config = {
  name: "reconciliation-sweep",
  schedule: "0 2 * * *", // Daily at 2am
};
