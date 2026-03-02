import { model } from "@medusajs/framework/utils";

/**
 * OrderStateConfig — defines the valid state machine for each product type.
 * Allows configuring which states are valid and what transitions are allowed.
 */
const OrderStateConfig = model.define("order_state_config", {
  id: model.id().primaryKey(),
  // The product/order type this config applies to (physical, digital, booking, subscription, service, auction)
  order_type: model.text(),
  // JSON array of valid states for this type
  valid_states: model.json(),
  // JSON map of state → allowed next states, e.g. { "pending": ["processing", "cancelled"] }
  transition_rules: model.json(),
  // JSON map of state → SLA hours before escalation
  sla_hours: model.json().nullable(),
  // Whether idempotency key must be present to finalize
  require_idempotency_key: model.boolean().default(true),
  tenant_id: model.text().nullable(),
  is_active: model.boolean().default(true),
});

export { OrderStateConfig };
