import { model } from "@medusajs/framework/utils";

/**
 * SubscriptionBenefitRule — maps a subscription plan to cross-product discounts or access grants.
 *
 * Example:
 *   plan_id: "platinum"
 *   target_product_type: "parking"
 *   benefit_type: "discount"
 *   benefit_value: 20  → 20% discount on all parking products
 */
const SubscriptionBenefitRule = model.define("subscription_benefit_rule", {
  id: model.id().primaryKey(),
  // The subscription plan this benefit belongs to
  plan_id: model.text(),
  plan_name: model.text().nullable(),
  // Which product type this benefit applies to
  target_product_type: model.text(),
  // benefit_type: discount | free_access | priority_queue | shipping_free
  benefit_type: model.enum([
    "discount",
    "free_access",
    "priority_queue",
    "shipping_free",
  ]),
  // benefit_value: for discount = percentage (0-100), for free_access = 1
  benefit_value: model.number().default(0),
  // Max uses per billing period (null = unlimited)
  max_uses_per_period: model.number().nullable(),
  is_active: model.boolean().default(true),
  tenant_id: model.text().nullable(),
  metadata: model.json().nullable(),
});

export { SubscriptionBenefitRule };
