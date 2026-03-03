import { model } from "@medusajs/framework/utils";

const ReturnRequest = model.define("return_request", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  customer_id: model.text(),
  status: model.text().default("pending"), // pending|approved|rejected|inspecting|restocked|refunded
  return_type: model.text().default("return"), // return|exchange|store_credit
  reason: model.text(),
  reason_details: model.text().nullable(),
  // Items: [{ line_item_id, qty, condition }]
  items: model.json(),
  vendor_id: model.text().nullable(),
  vendor_responsibility: model.boolean().default(false),
  eligibility_expires_at: model.dateTime().nullable(),
  approved_at: model.dateTime().nullable(),
  rejected_at: model.dateTime().nullable(),
  rejected_reason: model.text().nullable(),
  refund_amount: model.number().nullable(),
  // disposition: set by applyInspectionOutcome() to final routing decision
  // restocked | partial_refund | scrap | trade_in_accepted | warranty_repair | warranty_replace
  disposition: model.text().nullable(),
  restocking_fee_amount: model.number().nullable(),
  metadata: model.json().nullable(),
});

export { ReturnRequest };
