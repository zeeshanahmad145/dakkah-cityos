import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { CHARGEBACK_MODULE } from "../modules/chargeback";
import type ChargebackModuleService from "../modules/chargeback/service";
import { SETTLEMENT_MODULE } from "../modules/settlement";
import type SettlementModuleService from "../modules/settlement/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:chargeback-settlement-freeze");

export default async function chargebackSettlementFreeze({
  event,
  container,
}: SubscriberArgs<{
  order_id: string;
  provider_reference_id: string;
  provider?: string;
  reason_code: string;
  amount: number;
  currency_code?: string;
  due_by?: string;
}>) {
  const chargebackService: ChargebackModuleService =
    container.resolve(CHARGEBACK_MODULE);
  const settlementService: SettlementModuleService =
    container.resolve(SETTLEMENT_MODULE);
  const d = event.data;

  try {
    // 1. Create chargeback record (idempotent)
    const cb = await chargebackService.processWebhookEvent({
      orderId: d.order_id,
      providerReferenceId: d.provider_reference_id,
      provider: d.provider ?? "stripe",
      reasonCode: d.reason_code,
      amount: d.amount,
      currencyCode: d.currency_code ?? "SAR",
      dueBy: d.due_by ? new Date(d.due_by) : undefined,
    });

    // 2. Freeze the settlement ledger for this order
    const ledgers =
      ((await settlementService.listSettlementLedgers?.({
        order_id: d.order_id,
      })) as any[]) ?? [];
    for (const ledger of ledgers) {
      await settlementService.freezeForDispute(
        ledger.id,
        `chargeback:${d.provider_reference_id}`,
      );
    }

    logger.warn(
      `Chargeback received for order ${d.order_id} — settlement frozen (CB: ${cb.id})`,
    );
  } catch (err) {
    logger.error(`Chargeback settlement freeze error: ${String(err)}`);
  }
}

export const config: SubscriberConfig = {
  event: ["chargeback.received", "payment.chargeback_created"],
};
