import { model } from "@medusajs/framework/utils";

/**
 * OrderSlaTimer — tracks SLA deadlines per order per state transition.
 * When a transition fires, a timer is set. If unresolved, an alert is emitted.
 */
const OrderSlaTimer = model.define("order_sla_timer", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  current_state: model.text(),
  sla_deadline: model.dateTime(),
  breached_at: model.dateTime().nullable(),
  resolved_at: model.dateTime().nullable(),
  // escalation: none | notified | escalated | breached
  escalation_status: model.text().default("none"),
});

export { OrderSlaTimer };
