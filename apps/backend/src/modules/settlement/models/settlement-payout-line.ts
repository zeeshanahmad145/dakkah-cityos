import { model } from "@medusajs/framework/utils";

/**
 * SettlementLine — The atomic unit of a settlement payout.
 *
 * Every settlement splits gross revenue into typed lines: platform commission,
 * government levy, vendor net, affiliate payout, tax collected, etc.
 * These are the canonical ledger instructions that drive actual payouts.
 *
 * line_type:
 *   vendor_net    — amount transferred to the vendor
 *   commission    — platform commission withheld
 *   affiliate     — affiliate/referral payout
 *   levy          — government/municipality levy
 *   tax           — VAT or sales tax collected
 *   escrow_hold   — amount held pending condition (dispute window, delivery proof)
 *   reversal      — clawback line (negative amount, linked to original line)
 *   adjustment    — retroactive correction with audit reference
 */
const SettlementPayoutLine = model.define("settlement_payout_line", {
  id: model.id().primaryKey(),

  // Parent settlement batch
  settlement_id: model.text(),

  // What this line represents
  line_type: model.enum([
    "vendor_net",
    "commission",
    "affiliate",
    "levy",
    "tax",
    "escrow_hold",
    "reversal",
    "adjustment",
  ]),

  // Party receiving or paying
  party_type: model.text(), // "vendor" | "platform" | "government" | "affiliate" | "escrow"
  party_id: model.text().nullable(),

  // Amount
  amount: model.bigNumber(),
  currency_code: model.text().default("SAR"),

  // Ledger account linkage (drives actual LedgerEntry posting)
  ledger_account_type: model.text(), // "vendor" | "commission" | "levy" | "tax" | "escrow"
  ledger_account_id: model.text().nullable(),

  // Status
  status: model
    .enum(["pending", "posted", "paid", "reversed", "held"])
    .default("pending"),
  posted_at: model.dateTime().nullable(),
  paid_at: model.dateTime().nullable(),

  // Traceability
  reference_type: model.text().nullable(), // "order" | "subscription" | "auction" | "metering"
  reference_id: model.text().nullable(),
  parent_line_id: model.text().nullable(), // for reversals/adjustments, FK to original line

  // Topology reference (which RevenueSplitRule generated this line)
  topology_rule_id: model.text().nullable(),
  topology_version: model.number().nullable(),

  tenant_id: model.text().nullable(),
  metadata: model.json().nullable(),
});

export { SettlementPayoutLine };
