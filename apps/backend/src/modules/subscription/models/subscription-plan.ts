import { model } from "@medusajs/framework/utils";

/**
 * SubscriptionPlan stores subscription-domain metadata only.
 * Catalog (name/description/images/status) and pricing (price, compare_at_price)
 * are in Medusa Product + PriceSet via src/links/product-subscription-plan.ts
 *
 * Retained:
 * - handle: unique slug for URL-based plan lookup
 * - billing_interval*: recurring billing schedule (not in Medusa Product)
 * - trial_period_days: trial logic (domain-specific)
 * - features/limits: entitled capabilities (domain-specific)
 * - stripe_price_id: DEPRECATED — kept during transition, remove after full Medusa payment integration
 */
export const SubscriptionPlan = model
  .define("subscription_plan", {
    id: model.id().primaryKey(),
    tenant_id: model.text().nullable(),

    // URL-safe identifier (kept — useful for storefront routing)
    handle: model.text().unique(),

    // REMOVED: name, description, currency_code, price, compare_at_price, status
    // → these are now in Medusa Product + PriceSet

    // Billing (domain-specific — Medusa payment module uses these)
    billing_interval: model
      .enum(["daily", "weekly", "monthly", "quarterly", "yearly"])
      .default("monthly"),
    billing_interval_count: model.number().default(1),

    // Trial
    trial_period_days: model.number().default(0),

    // Entitlements (domain-specific)
    features: model.json().nullable(), // ["Unlimited products", "Priority support"]
    limits: model.json().nullable(), // { max_products: 100, max_orders: 1000 }
    included_products: model.json().nullable(),

    // Sorting
    sort_order: model.number().default(0),

    // DEPRECATED: stripe_price_id — migrating to Medusa payment module
    // @deprecated use Medusa PriceSet instead
    stripe_price_id: model.text().nullable(),
    // REMOVED: stripe_product_id — now the Medusa Product.id is the canonical product reference

    metadata: model.json().nullable(),
  })
  .indexes([{ on: ["tenant_id"] }, { on: ["handle"] }]);

export const SubscriptionDiscount = model
  .define("subscription_discount", {
    id: model.id().primaryKey(),
    tenant_id: model.text().nullable(),

    // Basic Info
    code: model.text().unique(),
    name: model.text(),

    // Discount Type
    discount_type: model.enum(["percentage", "fixed", "trial_extension"]),
    discount_value: model.bigNumber(),

    // Duration
    duration: model.enum(["once", "repeating", "forever"]).default("once"),
    duration_in_months: model.number().nullable(),

    // Applicability
    applicable_plans: model.json().nullable(),

    // Usage Limits
    max_redemptions: model.number().nullable(),
    current_redemptions: model.number().default(0),
    max_redemptions_per_customer: model.number().default(1),

    // Validity
    starts_at: model.dateTime().nullable(),
    ends_at: model.dateTime().nullable(),

    is_active: model.boolean().default(true),

    // DEPRECATED: stripe_coupon_id — migrating to Medusa promotion module
    stripe_coupon_id: model.text().nullable(),

    metadata: model.json().nullable(),
  })
  .indexes([{ on: ["tenant_id"] }, { on: ["code"] }, { on: ["is_active"] }]);
