import { model } from "@medusajs/framework/utils";

/**
 * ParkingZone stores geo/operational metadata only.
 * Pricing (hourly/daily/monthly rates) is owned by Medusa Product variants + PriceSet
 * via src/links/product-parking-zone.ts
 * Pass types (Hourly, Daily, Monthly Reserved) are separate Medusa product variants.
 */
const ParkingZone = model.define("parking_zone", {
  id: model.id().primaryKey(),
  tenant_id: model.text(),
  name: model.text(),
  description: model.text().nullable(),
  zone_type: model.enum([
    "street",
    "garage",
    "lot",
    "valet",
    "airport",
    "reserved",
  ]),
  // Geo & location
  address: model.json().nullable(),
  latitude: model.number().nullable(),
  longitude: model.number().nullable(),
  // Capacity
  total_spots: model.number(),
  available_spots: model.number(),
  // REMOVED: hourly_rate, daily_rate, monthly_rate, currency_code
  // → these are product variants (Hourly Pass, Daily Pass, Monthly Pass)
  operating_hours: model.json().nullable(),
  is_active: model.boolean().default(true),
  has_ev_charging: model.boolean().default(false),
  has_disabled_spots: model.boolean().default(false),
  metadata: model.json().nullable(),
});

export default ParkingZone;
