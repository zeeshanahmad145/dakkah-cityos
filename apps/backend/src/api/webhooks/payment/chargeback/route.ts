import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { CHARGEBACK_MODULE } from "../../../../modules/chargeback";
import type ChargebackModuleService from "../../../../modules/chargeback/service";
import { EVENT_OUTBOX_MODULE } from "../../../../modules/event-outbox";
import type { EventOutboxModuleService } from "../../../../modules/event-outbox";
import { createLogger } from "../../../../lib/logger";

const logger = createLogger("webhook:payment-chargeback");

// Stripe webhook event → internal mapping
const STATUS_MAP: Record<string, string> = {
  "charge.dispute.created": "received",
  "charge.dispute.updated": "received",
  "charge.dispute.closed": "resolved",
  "charge.dispute.funds_reinstated": "won",
  "charge.dispute.funds_withdrawn": "lost",
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const chargebackService: ChargebackModuleService =
    req.scope.resolve(CHARGEBACK_MODULE);
  const outboxService = req.scope.resolve(
    EVENT_OUTBOX_MODULE,
  ) as unknown as EventOutboxModuleService;
  const eventBus = req.scope.resolve("event_bus") as any;

  try {
    const payload = req.body as any;
    const stripeEventId: string = payload.id ?? "";

    // Idempotency guard — skip if already processed (Stripe retries)
    if (stripeEventId) {
      const alreadyProcessed = await outboxService.markProcessed(
        stripeEventId,
        "chargeback_webhook",
      );
      if (alreadyProcessed)
        return res.json({ received: true, skipped: true, reason: "duplicate" });
    }
    const eventType: string = payload.type ?? "";
    const dispute = payload.data?.object ?? {};

    if (!STATUS_MAP[eventType]) {
      return res.json({ received: true, skipped: true });
    }

    const orderId = dispute.metadata?.order_id ?? dispute.charge ?? "";

    const chargeback = await chargebackService.processWebhookEvent({
      orderId,
      providerReferenceId: dispute.id,
      provider: "stripe",
      reasonCode: dispute.reason ?? "general",
      amount: (dispute.amount ?? 0) / 100,
      currencyCode: (dispute.currency ?? "SAR").toUpperCase(),
      dueBy: dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000)
        : undefined,
      metadata: { stripe_event: eventType },
    });

    // Emit internal event for settlement-freeze subscriber
    await eventBus.emit?.("chargeback.received", {
      order_id: orderId,
      provider_reference_id: dispute.id,
      provider: "stripe",
      reason_code: dispute.reason ?? "general",
      amount: (dispute.amount ?? 0) / 100,
      currency_code: (dispute.currency ?? "SAR").toUpperCase(),
    });

    // Handle resolution
    if (eventType === "charge.dispute.funds_reinstated") {
      await chargebackService.updateStatus(dispute.id, "won");
    } else if (eventType === "charge.dispute.funds_withdrawn") {
      await chargebackService.updateStatus(dispute.id, "lost");
    }

    logger.info(`Chargeback webhook processed: ${eventType} (${dispute.id})`);
    res.json({ received: true, chargeback_id: chargeback.id });
  } catch (err) {
    logger.error(`Chargeback webhook error: ${String(err)}`);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
