import { model } from "@medusajs/framework/utils";

/**
 * LedgerEntry — double-entry accounting record.
 *
 * Every value movement on the platform (wallet credit, loyalty earn,
 * commission charge, affiliate payout, escrow lock, settlement release)
 * writes a pair of LedgerEntry rows: one debit, one credit.
 * The sum of all debits MUST equal the sum of all credits at all times.
 *
 * account_type examples:
 *   "wallet"      — customer wallet account
 *   "loyalty"     — loyalty points pool
 *   "commission"  — platform commission account
 *   "affiliate"   — affiliate payout liability
 *   "escrow"      — held funds pending release
 *   "vendor"      — vendor net payout account
 *   "tax"         — tax collected
 *   "levy"        — government levy
 *   "settlement"  — settlement sweep account
 *
 * value_type:
 *   "money"       — SAR/USD/etc monetary value
 *   "loyalty_pts" — loyalty points (non-monetary)
 *   "credit_line" — B2B credit facility
 *   "escrow_unit" — escrowed value unit
 */
const LedgerEntry = model.define("ledger_entry", {
  id: model.id().primaryKey(),

  // Journal ID groups the debit+credit pair for atomic posting
  journal_id: model.text(),

  // Account
  account_type: model.text(), // wallet | loyalty | commission | affiliate | escrow | vendor | tax | levy
  account_id: model.text(), // customer_id | vendor_id | "platform" | "government"

  // Amounts — exactly one of debit_amount or credit_amount will be non-zero per row
  debit_amount: model.bigNumber().default(0),
  credit_amount: model.bigNumber().default(0),

  // Value classification
  value_type: model.text().default("money"), // money | loyalty_pts | credit_line | escrow_unit
  currency_code: model.text().default("SAR"),

  // Description & traceability
  description: model.text().nullable(),
  reference_type: model.text().nullable(), // order | refund | settlement | metering | subscription
  reference_id: model.text().nullable(), // the ID of the originating record

  // Status
  status: model.text().default("posted"), // posted | pending | reversed | frozen

  posted_at: model.dateTime(),
  tenant_id: model.text().nullable(),
  metadata: model.json().nullable(),
});

export { LedgerEntry };
