import { model } from "@medusajs/framework/utils";

const FraudSignal = model.define("fraud_signal", {
  id: model.id().primaryKey(),
  customer_id: model.text().nullable(),
  vendor_id: model.text().nullable(),
  order_id: model.text().nullable(),
  // signal_type: velocity|high_value|geo_mismatch|coupon_abuse|card_test|vendor_cancel_spike
  signal_type: model.text(),
  score_contribution: model.number().default(0),
  metadata: model.json().nullable(),
});

const FraudRule = model.define("fraud_rule", {
  id: model.id().primaryKey(),
  rule_type: model.text(), // velocity|cart_value|ip_mismatch|coupon_reuse|vendor_rate
  threshold: model.number(),
  // action: flag|block|review
  action: model.text().default("flag"),
  score_weight: model.number().default(10),
  is_active: model.boolean().default(true),
});

const FraudCase = model.define("fraud_case", {
  id: model.id().primaryKey(),
  customer_id: model.text().nullable(),
  vendor_id: model.text().nullable(),
  order_id: model.text().nullable(),
  composite_score: model.number().default(0),
  // status: open|reviewing|resolved_safe|resolved_fraud
  status: model.text().default("open"),
  action_taken: model.text().nullable(), // blocked|flagged|none
  // JSON array of fraud_signal ids
  signal_ids: model.json(),
  resolved_at: model.dateTime().nullable(),
  resolution_notes: model.text().nullable(),
});

export { FraudSignal, FraudRule, FraudCase };
