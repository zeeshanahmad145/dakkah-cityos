import { model } from "@medusajs/framework/utils";

/**
 * ReconciliationBatch — represents one provider payout batch (e.g. Stripe payout).
 * Matched against internal SettlementLedger records.
 */
const ReconciliationBatch = model.define("reconciliation_batch", {
  id: model.id().primaryKey(),
  provider: model.text().default("stripe"),
  // Provider's own payout/batch reference ID
  batch_reference: model.text(),
  batch_amount: model.number(),
  batch_date: model.dateTime(),
  currency_code: model.text().default("SAR"),
  // status: pending|matched|partially_matched|mismatched|auto_held
  status: model.text().default("pending"),
  mismatch_amount: model.number().default(0),
  auto_held: model.boolean().default(false),
  hold_reason: model.text().nullable(),
  resolved_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
});

/**
 * ReconciliationLine — per-order match between batch and internal settlement.
 */
const ReconciliationLine = model.define("reconciliation_line", {
  id: model.id().primaryKey(),
  batch_id: model.text(),
  settlement_ledger_id: model.text().nullable(),
  order_id: model.text().nullable(),
  expected_amount: model.number(),
  actual_amount: model.number(),
  delta: model.number().default(0),
  // resolution: matched|manual_override|written_off|pending
  resolution: model.text().default("pending"),
  resolved_by: model.text().nullable(),
  resolved_at: model.dateTime().nullable(),
  notes: model.text().nullable(),
});

export { ReconciliationBatch, ReconciliationLine };
