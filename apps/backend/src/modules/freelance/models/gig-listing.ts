import { model } from "@medusajs/framework/utils";

/**
 * GigListing stores only freelance-domain metadata.
 * Catalog fields (title, description, images, status, pricing) are owned by
 * the Medusa Product module and linked via src/links/product-gig.ts
 */
const GigListing = model.define("gig_listing", {
  id: model.id().primaryKey(),
  tenant_id: model.text(),
  freelancer_id: model.text(),
  // Freelance-specific classification
  category: model.text().nullable(),
  subcategory: model.text().nullable(),
  listing_type: model.enum(["fixed_price", "hourly", "milestone"]),
  // Delivery & quality terms (domain-specific, not in Medusa product)
  delivery_time_days: model.number().nullable(),
  revisions_included: model.number().default(1),
  // Performance metrics (domain-specific)
  total_orders: model.number().default(0),
  avg_rating: model.number().nullable(),
  // Skills & portfolio (domain-specific)
  skill_tags: model.json().nullable(),
  portfolio_urls: model.json().nullable(),
  metadata: model.json().nullable(),
});

export default GigListing;
