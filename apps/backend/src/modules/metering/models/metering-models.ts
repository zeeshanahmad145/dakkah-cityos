import { model } from "@medusajs/framework/utils";

/**
 * UsageEvent — raw usage record for pay-per-use services.
 * Examples: parking session, API call, storage GB-hour, fitness class drop-in.
 */
const UsageEvent = model.define("usage_event", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  // resource_type: parking | fitness | storage | api | utility | travel_addon
  resource_type: model.text(),
  resource_id: model.text(), // slot_id | gym_id | bucket_id etc.
  units: model.number(), // quantity consumed (minutes, GB, calls)
  unit_label: model.text().default("unit"), // "minute" | "GB" | "call" | "session"
  unit_price: model.bigNumber(), // price per unit
  total_amount: model.bigNumber(), // units * unit_price
  currency_code: model.text().default("SAR"),
  // billing_period_id: links to metering period after aggregation
  billing_period_id: model.text().nullable(),
  // billed: true once included in a MeteringPeriod order
  billed: model.boolean().default(false),
  tenant_id: model.text().nullable(),
  vendor_id: model.text().nullable(),
  metadata: model.json().nullable(),
});

/**
 * MeteringPeriod — aggregation of UsageEvents for a customer over a billing window.
 * When billed=true, an order has been created for this period.
 */
const MeteringPeriod = model.define("metering_period", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  resource_type: model.text(),
  period_start: model.dateTime(),
  period_end: model.dateTime(),
  total_units: model.number().default(0),
  total_amount: model.bigNumber().default(0),
  currency_code: model.text().default("SAR"),
  // Status: open | closed | billed | void
  status: model.text().default("open"),
  // Created order reference when billed
  order_id: model.text().nullable(),
  billed_at: model.dateTime().nullable(),
  tenant_id: model.text().nullable(),
});

export { UsageEvent, MeteringPeriod };
