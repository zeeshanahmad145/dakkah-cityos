import { model } from "@medusajs/framework/utils";

/**
 * InsurancePolicy stores insurance-domain metadata only.
 * The insurance plan (product) and premium (price) are in Medusa Product + PriceSet
 * via src/links/product-insurance-policy.ts
 * order_id already present — links the checkout order to the active policy.
 */
const InsurancePolicy = model.define("ins_policy", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  // REMOVED: product_id (bare text) — managed by defineLink join table
  order_id: model.text().nullable(), // Medusa order that created/renewed this policy
  plan_type: model.text(),
  coverage_amount: model.bigNumber(),
  premium: model.bigNumber(), // @deprecated — use Medusa PriceSet going forward
  start_date: model.dateTime(),
  end_date: model.dateTime(),
  status: model
    .enum(["active", "expired", "cancelled", "claimed"])
    .default("active"),
  policy_number: model.text(),
  cancellation_reason: model.text().nullable(),
  cancelled_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
});

export default InsurancePolicy;
