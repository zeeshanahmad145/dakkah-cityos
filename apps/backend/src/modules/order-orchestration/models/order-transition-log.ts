import { model } from "@medusajs/framework/utils";

/**
 * OrderTransitionLog — immutable audit log of every state change on an order.
 */
const OrderTransitionLog = model.define("order_transition_log", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  from_state: model.text().nullable(),
  to_state: model.text(),
  triggered_by: model.text(), // "system" | "admin:{id}" | "customer:{id}" | "workflow:{name}"
  idempotency_key: model.text().nullable(),
  notes: model.text().nullable(),
  metadata: model.json().nullable(),
});

export { OrderTransitionLog };
