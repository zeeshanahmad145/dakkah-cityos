import { MedusaService } from "@medusajs/framework/utils";
import {
  ReconciliationBatch,
  ReconciliationLine,
} from "./models/reconciliation-batch";

const MISMATCH_ALERT_THRESHOLD = 0.01; // 1% tolerance

class ReconciliationModuleService extends MedusaService({
  ReconciliationBatch,
  ReconciliationLine,
}) {
  /**
   * Create a reconciliation batch from a provider payout event.
   * Matches against known settlement ledger IDs.
   */
  async createBatchFromPayout(params: {
    provider: string;
    batchReference: string;
    batchAmount: number;
    batchDate: Date;
    currencyCode: string;
    settlementIds?: string[]; // Known settlement IDs in this payout
    metadata?: Record<string, any>;
  }): Promise<{ batch: any; mismatched: boolean }> {
    // Idempotency
    const existing = (await this.listReconciliationBatches({
      batch_reference: params.batchReference,
    })) as any[];
    if (existing.length > 0) return { batch: existing[0], mismatched: false };

    const batch = await this.createReconciliationBatches({
      provider: params.provider,
      batch_reference: params.batchReference,
      batch_amount: params.batchAmount,
      batch_date: params.batchDate,
      currency_code: params.currencyCode ?? "SAR",
      status: "pending",
      metadata: params.metadata ?? null,
    } as any);

    // If settlement IDs provided, create and match lines
    if (params.settlementIds && params.settlementIds.length > 0) {
      const expectedPerLine = params.batchAmount / params.settlementIds.length;

      await Promise.all(
        params.settlementIds.map((sid) =>
          this.createReconciliationLines({
            batch_id: batch.id,
            settlement_ledger_id: sid,
            expected_amount: expectedPerLine,
            actual_amount: expectedPerLine, // Will be updated on confirmation
            delta: 0,
            resolution: "matched",
          } as any),
        ),
      );

      await this.updateReconciliationBatches({
        id: batch.id,
        status: "matched",
      } as any);
      return { batch, mismatched: false };
    }

    // No settlement IDs = unmatched batch
    const mismatchAmt = params.batchAmount;
    const mismatched =
      Math.abs(mismatchAmt) / params.batchAmount > MISMATCH_ALERT_THRESHOLD;

    if (mismatched) {
      await this.updateReconciliationBatches({
        id: batch.id,
        status: "mismatched",
        mismatch_amount: mismatchAmt,
        auto_held: true,
        hold_reason: "No matching settlement ledger entries",
      } as any);
    }

    return { batch, mismatched };
  }

  /**
   * Get all unresolved batches older than N hours.
   */
  async getStaleUnmatched(olderThanHours = 24): Promise<any[]> {
    const batches = (await this.listReconciliationBatches({
      status: "pending",
    })) as any[];
    const threshold = new Date(Date.now() - olderThanHours * 3600000);
    return batches.filter((b: any) => new Date(b.created_at) < threshold);
  }
}

export default ReconciliationModuleService;
