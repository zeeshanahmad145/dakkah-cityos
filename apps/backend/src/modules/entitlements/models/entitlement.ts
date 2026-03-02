import { model } from "@medusajs/framework/utils";

const Entitlement = model.define("entitlement", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  // source_module: subscription|membership|digital_product|event_ticketing|manual
  source_module: model.text(),
  source_id: model.text(), // subscription_id, membership_id, order_id etc.
  // resource_type: course|content|feature|event|product|service
  resource_type: model.text(),
  resource_id: model.text().nullable(), // null = global entitlement for this type
  status: model.text().default("active"), // active|expired|revoked|grace
  valid_from: model.dateTime(),
  valid_until: model.dateTime().nullable(), // null = perpetual
  grace_until: model.dateTime().nullable(), // grace period after expiry
  revoked_at: model.dateTime().nullable(),
  revoke_reason: model.text().nullable(),
  metadata: model.json().nullable(),
});

const EntitlementPolicy = model.define("entitlement_policy", {
  id: model.id().primaryKey(),
  // source_module + tier define which plan gets these entitlements
  source_module: model.text(),
  tier: model.text().nullable(),
  // What this policy grants access to
  grants: model.json(), // [{ resource_type, resource_id?, max_uses? }]
  // Stacking: whether this policy's entitlements stack with others
  stackable: model.boolean().default(false),
  grace_days: model.number().default(3),
  is_active: model.boolean().default(true),
});

export { Entitlement, EntitlementPolicy };
