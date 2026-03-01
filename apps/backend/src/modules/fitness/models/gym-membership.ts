import { model } from "@medusajs/framework/utils";

/**
 * GymMembership stores only fitness-domain metadata.
 * Pricing (monthly_fee) is owned by Medusa Product + PriceSet via src/links/product-fitness-plan.ts
 * customer_id references Medusa's native customer entity.
 * On order.placed the order-to-fitness.ts subscriber creates this record.
 */
const GymMembership = model.define("gym_membership", {
  id: model.id().primaryKey(),
  tenant_id: model.text(),
  customer_id: model.text(), // Medusa customer ID
  facility_id: model.text().nullable(),
  order_id: model.text().nullable(), // Medusa order that created this membership
  membership_type: model.enum([
    "basic",
    "premium",
    "vip",
    "student",
    "corporate",
    "family",
  ]),
  status: model
    .enum(["pending", "active", "frozen", "expired", "cancelled"])
    .default("pending"),
  start_date: model.dateTime(),
  end_date: model.dateTime().nullable(),
  // REMOVED: monthly_fee, currency_code — now in Medusa PriceSet
  auto_renew: model.boolean().default(true),
  freeze_count: model.number().default(0),
  max_freezes: model.number().default(2),
  access_hours: model.json().nullable(),
  includes: model.json().nullable(),
  metadata: model.json().nullable(),
});

export default GymMembership;
