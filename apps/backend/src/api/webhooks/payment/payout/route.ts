import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { RECONCILIATION_MODULE } from "../../../../modules/reconciliation";
import type ReconciliationModuleService from "../../../../modules/reconciliation/service";
import { createLogger } from "../../../../lib/logger";

const logger = createLogger("webhook:payment-payout");

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const reconciliationService: ReconciliationModuleService = req.scope.resolve(
    RECONCILIATION_MODULE,
  );
  const eventBus = req.scope.resolve("eventBusService") as any;

  try {
    const payload = req.body as any;
    const eventType: string = payload.type ?? "";
    const payout = payload.data?.object ?? {};

    // Only handle payout events
    if (!eventType.startsWith("payout.")) {
      return res.json({ received: true, skipped: true });
    }

    const { batch, mismatched } =
      await reconciliationService.createBatchFromPayout({
        provider: "stripe",
        batchReference: payout.id,
        batchAmount: (payout.amount ?? 0) / 100,
        batchDate: payout.arrival_date
          ? new Date(payout.arrival_date * 1000)
          : new Date(),
        currencyCode: (payout.currency ?? "SAR").toUpperCase(),
        settlementIds: payout.metadata?.settlement_ids
          ? JSON.parse(payout.metadata.settlement_ids)
          : undefined,
        metadata: { stripe_event: eventType, status: payout.status },
      });

    if (mismatched) {
      await eventBus.emit?.("reconciliation.mismatch", {
        batch_id: batch.id,
        batch_reference: payout.id,
        amount: (payout.amount ?? 0) / 100,
      });
      logger.warn(`Payout ${payout.id} has reconciliation mismatch`);
    }

    res.json({ received: true, batch_id: batch.id, mismatched });
  } catch (err) {
    logger.error(`Payout webhook error: ${String(err)}`);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
