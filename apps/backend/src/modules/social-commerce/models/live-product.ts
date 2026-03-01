import { model } from "@medusajs/framework/utils";

/**
 * LiveProduct stores only social-commerce stream metadata.
 * The product ↔ live_product relationship is managed by the join table via
 * src/links/product-live-stream.ts (defineLink).
 *
 * variant_id is kept as a reference string for variant-level flash pricing.
 * Use remoteQuery to fetch full product + variant data.
 */
const LiveProduct = model.define("live_product", {
  id: model.id().primaryKey(),
  tenant_id: model.text(),
  // Stream context (domain-specific)
  stream_id: model.text(),
  // Optional: reference to a specific variant for flash pricing
  variant_id: model.text().nullable(),
  featured_at: model.dateTime().nullable(),
  // Flash sale fields (domain-specific, not in Medusa product)
  flash_price: model.bigNumber().nullable(),
  flash_quantity: model.number().nullable(),
  flash_sold: model.number().default(0),
  currency_code: model.text(),
  display_order: model.number().default(0),
  is_active: model.boolean().default(true),
  metadata: model.json().nullable(),
});

export default LiveProduct;
