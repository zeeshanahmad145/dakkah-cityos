import { model } from "@medusajs/framework/utils";

/**
 * SettlementLedger — one record per completed order.
 * Summarizes how the order total is split across all parties.
 */
const SettlementLedger = model.define("settlement_ledger", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  status: model.text().default("pending"), // pending|settled|frozen|reversed|posted_to_erp
  gross_amount: model.number(),
  platform_fee: model.number().default(0),
  vendor_net: model.number().default(0),
  affiliate_commission: model.number().default(0),
  ambassador_commission: model.number().default(0),
  tax_collected: model.number().default(0),
  refund_total: model.number().default(0),
  net_payout: model.number().default(0),
  currency_code: model.text().default("SAR"),
  // freeze_reason: populated when a dispute is opened
  freeze_reason: model.text().nullable(),
  frozen_at: model.dateTime().nullable(),
  settled_at: model.dateTime().nullable(),
  erp_posted_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
});

/**
 * SettlementLine — one row per party per order settlement.
 */
const SettlementLine = model.define("settlement_line", {
  id: model.id().primaryKey(),
  ledger_id: model.text(),
  // party_type: platform|vendor|affiliate|ambassador|tax_authority
  party_type: model.text(),
  party_id: model.text().nullable(),
  // direction: credit (owed to party) | debit (owes platform)
  direction: model.text().default("credit"),
  amount: model.number(),
  currency_code: model.text().default("SAR"),
  // payout_id FK – populated when payout is triggered
  payout_id: model.text().nullable(),
  status: model.text().default("pending"), // pending|paid|reversed
});

/**
 * SettlementReversal — created when refund/RMA triggers a commission clawback.
 */
const SettlementReversal = model.define("settlement_reversal", {
  id: model.id().primaryKey(),
  ledger_id: model.text(),
  trigger_type: model.text(), // refund|rma|dispute_resolved
  trigger_id: model.text(),
  reversed_amount: model.number(),
  reversal_lines: model.json(), // partial line reversals
});

export { SettlementLedger, SettlementLine, SettlementReversal };
