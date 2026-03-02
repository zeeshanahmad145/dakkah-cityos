import { model } from "@medusajs/framework/utils";

/**
 * PricingDecision — an auditable record of how the final price was computed.
 * Answers "why this price?" for any cart line item.
 */
const PricingDecision = model.define("pricing_decision", {
  id: model.id().primaryKey(),
  // May be tied to a cart or an order
  cart_id: model.text().nullable(),
  order_id: model.text().nullable(),
  product_id: model.text(),
  variant_id: model.text().nullable(),
  customer_id: model.text().nullable(),
  company_id: model.text().nullable(),
  node_id: model.text().nullable(),
  quantity: model.number().default(1),
  base_price: model.number(),
  final_price: model.number(),
  currency_code: model.text().default("SAR"),
  // applied_rules: ordered list of price adjustments
  // [{ priority, rule_type, source_id, source_label, delta, reason }]
  applied_rules: model.json(),
  // winning_rule: the highest-priority rule that set the price
  winning_rule_type: model.text().nullable(),
  computed_at: model.dateTime(),
});

export { PricingDecision };
