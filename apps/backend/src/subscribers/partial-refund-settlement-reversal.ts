import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { SETTLEMENT_MODULE } from "../modules/settlement";
import type SettlementModuleService from "../modules/settlement/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:partial-refund-settlement-reversal");

export default async function partialRefundSettlementReversal({
  event,
  container,
}: SubscriberArgs<{
  id: string; // refund id
  order_id: string;
  amount: number;
  currency_code: string;
  items?: Array<{ id: string; quantity: number; unit_price: number }>;
  note?: string;
}>) {
  const settlementService: SettlementModuleService =
    container.resolve(SETTLEMENT_MODULE);
  const { order_id, amount, items = [] } = event.data;

  if (!order_id) return;

  try {
    // Retrieve the settled ledger for this order
    const ledgers = (await settlementService.listSettlementLedgers({
      order_id,
    })) as any[];
    const ledger = ledgers.find(
      (l: any) => l.status === "settled" || l.status === "pending",
    );
    if (!ledger) {
      logger.warn(
        `No settlement ledger found for order ${order_id} — reversal skipped`,
      );
      return;
    }

    const grossAmount = ledger.gross_amount ?? 0;
    if (grossAmount <= 0) return;

    // Pro-rata factor: what fraction of the order is being refunded?
    const refundRatio = Math.min(amount / grossAmount, 1);

    // Calculate clawback amounts
    const commissionClawback = Number(
      (ledger.platform_fee * refundRatio).toFixed(2),
    );
    const vendorNetAdjustment = Number(
      (ledger.vendor_net * refundRatio).toFixed(2),
    );
    const affiliateClawback = Number(
      (ledger.affiliate_commission * refundRatio).toFixed(2),
    );
    const loyaltyReversal = Number(
      (ledger.ambassador_commission * refundRatio).toFixed(2),
    );
    const taxReversal = Number((ledger.tax_collected * refundRatio).toFixed(2));

    // Create a SettlementReversal record
    await settlementService.createSettlementReversals({
      ledger_id: ledger.id,
      trigger_type: "refund",
      trigger_id: event.data.id,
      reversed_amount: amount,
      reversal_lines: [
        { party: "platform", amount: commissionClawback, direction: "debit" },
        { party: "vendor", amount: vendorNetAdjustment, direction: "debit" },
        { party: "affiliate", amount: affiliateClawback, direction: "debit" },
        { party: "loyalty", amount: loyaltyReversal, direction: "debit" },
        { party: "tax", amount: taxReversal, direction: "credit" },
      ],
    } as any);

    // Update ledger to reflect reversal
    await settlementService.updateSettlementLedgers({
      id: ledger.id,
      refund_total: (ledger.refund_total ?? 0) + amount,
      net_payout: Math.max(0, (ledger.net_payout ?? 0) - vendorNetAdjustment),
    } as any);

    logger.info(
      `Partial refund reversal for order ${order_id}: ` +
        `refund=${amount}, commission_clawback=${commissionClawback}, vendor_adj=${vendorNetAdjustment}, affiliate_clawback=${affiliateClawback}`,
    );
  } catch (err) {
    logger.error(
      `Partial refund reversal error (order ${order_id}): ${String(err)}`,
    );
  }
}

export const config: SubscriberConfig = {
  event: ["order.refund_created"],
};
