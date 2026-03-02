import { model } from "@medusajs/framework/utils";

/**
 * Chargeback — a payment-provider-level dispute (e.g. Stripe charge.dispute).
 * Distinct from customer-facing disputes in the `dispute` module.
 */
const Chargeback = model.define("chargeback", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  payment_id: model.text().nullable(),
  // Provider reference: Stripe dispute ID, PayPal case ID, etc.
  provider_reference_id: model.text(),
  provider: model.text().default("stripe"),
  // Reason codes: fraudulent|duplicate|product_not_received|credit_not_processed|general
  reason_code: model.text(),
  amount: model.number(),
  currency_code: model.text().default("SAR"),
  // status: received|evidence_submitted|won|lost|withdrawn
  status: model.text().default("received"),
  due_by: model.dateTime().nullable(),
  // Negative balance applied to vendor if chargeback is lost
  negative_balance_amount: model.number().default(0),
  negative_balance_applied: model.boolean().default(false),
  settlement_frozen: model.boolean().default(false),
  resolved_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
});

const ChargebackEvidence = model.define("chargeback_evidence", {
  id: model.id().primaryKey(),
  chargeback_id: model.text(),
  // evidence_type: receipt|tracking_info|refund_policy|customer_communication|uncategorized
  evidence_type: model.text(),
  description: model.text().nullable(),
  file_url: model.text().nullable(),
  submitted_at: model.dateTime().nullable(),
});

export { Chargeback, ChargebackEvidence };
