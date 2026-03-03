import { model } from "@medusajs/framework/utils";

/**
 * SagaInstance tracks the lifecycle of a distributed transaction.
 * When a step fails, the `compensate()` service method reads `steps_executed`
 * and fires compensation handlers in reverse order.
 */
const SagaInstance = model.define("saga_instance", {
  id: model.id().primaryKey(),
  // saga_type: checkout | refund | payout | rma | vendor_onboarding
  saga_type: model.text(),
  // status: running | completed | failed | compensating | compensated
  status: model.text().default("running"),
  current_step: model.number().default(0),
  // steps_executed: [{ step: string, output: object, executed_at: ISO }]
  steps_executed: model.json().nullable(),
  // compensation_log: [{ step: string, result: object, compensated_at: ISO }]
  compensation_log: model.json().nullable(),
  // payload: original saga input for replay/compensation
  payload: model.json(),
  // references
  order_id: model.text().nullable(),
  customer_id: model.text().nullable(),
  tenant_id: model.text().nullable(),
  failure_reason: model.text().nullable(),
  completed_at: model.dateTime().nullable(),
  failed_at: model.dateTime().nullable(),
});

export { SagaInstance };
