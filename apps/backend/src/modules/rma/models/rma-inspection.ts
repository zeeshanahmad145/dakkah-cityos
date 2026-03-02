import { model } from "@medusajs/framework/utils";

const RmaInspection = model.define("rma_inspection", {
  id: model.id().primaryKey(),
  return_request_id: model.text(),
  inspector_id: model.text().nullable(),
  // Item condition assessments: [{ line_item_id, condition: good|damaged|unsellable, notes }]
  item_assessments: model.json(),
  overall_condition: model.text().nullable(), // good|damaged|unsellable
  decision: model.text().nullable(), // approved|partial|rejected
  restocking_fee_applied: model.number().nullable(),
  // Photo evidence URLs
  photo_urls: model.json().nullable(),
  inspected_at: model.dateTime().nullable(),
  notes: model.text().nullable(),
});

const RestockingFeeRule = model.define("restocking_fee_rule", {
  id: model.id().primaryKey(),
  vendor_id: model.text().nullable(),
  product_category_id: model.text().nullable(),
  fee_type: model.text().default("percentage"), // percentage|flat
  fee_value: model.number().default(0),
  applies_if: model.text().default("always"), // always|damaged|opened
  max_days_after_delivery: model.number().default(30),
  is_active: model.boolean().default(true),
});

const ExchangeOrder = model.define("exchange_order", {
  id: model.id().primaryKey(),
  original_order_id: model.text(),
  return_request_id: model.text(),
  new_order_id: model.text().nullable(),
  replacement_items: model.json(),
  status: model.text().default("pending"), // pending|processing|fulfilled|cancelled
  price_difference: model.number().default(0),
});

export { RmaInspection, RestockingFeeRule, ExchangeOrder };
