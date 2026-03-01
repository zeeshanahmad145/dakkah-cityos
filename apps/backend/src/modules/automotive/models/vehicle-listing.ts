import { model } from "@medusajs/framework/utils";

/**
 * VehicleListing stores automotive-domain metadata only.
 * Catalog (title = "Make Model Year", description, images, status) and pricing
 * are in Medusa Product + PriceSet via src/links/product-vehicle-listing.ts
 * listing_type (sale/lease/auction) is stored here as a domain attribute.
 */
const VehicleListing = model.define("vehicle_listing", {
  id: model.id().primaryKey(),
  tenant_id: model.text(),
  seller_id: model.text(),
  listing_type: model.enum(["sale", "lease", "auction"]),
  // REMOVED: title, description, price, currency_code, images, status
  // → these are now in Medusa Product + PriceSet
  make: model.text(),
  model_name: model.text(),
  year: model.number(),
  mileage_km: model.number().nullable(),
  fuel_type: model
    .enum(["petrol", "diesel", "electric", "hybrid", "hydrogen"])
    .nullable(),
  transmission: model.enum(["automatic", "manual", "cvt"]).nullable(),
  body_type: model
    .enum([
      "sedan",
      "suv",
      "hatchback",
      "truck",
      "van",
      "coupe",
      "convertible",
      "wagon",
    ])
    .nullable(),
  color: model.text().nullable(),
  vin: model.text().nullable(),
  condition: model
    .enum(["new", "certified_pre_owned", "used", "salvage"])
    .default("used"),
  features: model.json().nullable(),
  location_city: model.text().nullable(),
  location_country: model.text().nullable(),
  view_count: model.number().default(0),
  metadata: model.json().nullable(),
});

export default VehicleListing;
