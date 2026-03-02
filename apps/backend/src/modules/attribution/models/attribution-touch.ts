import { model } from "@medusajs/framework/utils";

const AttributionTouch = model.define("attribution_touch", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  // source_type: affiliate|campaign|referral|organic|social|email
  source_type: model.text(),
  source_id: model.text().nullable(),
  order_id: model.text().nullable(), // populated on conversion
  utm_source: model.text().nullable(),
  utm_medium: model.text().nullable(),
  utm_campaign: model.text().nullable(),
  ip_country: model.text().nullable(),
  device_type: model.text().nullable(),
  touched_at: model.dateTime(),
  converted_at: model.dateTime().nullable(),
});

const AttributionCredit = model.define("attribution_credit", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  touch_id: model.text(),
  // credit_model: last_touch|first_touch|linear|time_decay
  credit_model: model.text().default("last_touch"),
  credit_pct: model.number(), // 0-100
  amount: model.number(),
  currency_code: model.text().default("SAR"),
  source_type: model.text(),
  source_id: model.text().nullable(),
  // payout_triggered: true when commission was dispatched
  payout_triggered: model.boolean().default(false),
});

export { AttributionTouch, AttributionCredit };
