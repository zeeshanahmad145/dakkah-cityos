import { model } from "@medusajs/framework/utils";

/**
 * FreshProduct stores only grocery-domain metadata.
 * Catalog fields (title, description, images, pricing, status) are owned by
 * the Medusa Product module and linked via src/links/product-grocery.ts
 *
 * The product ↔ fresh_product relationship is managed by the link join table:
 *   product_grocery (product_id, fresh_product_id)
 * Use remoteQuery or useQueryGraphStep to fetch product + freshProduct together.
 */
const FreshProduct = model.define("fresh_product", {
  id: model.id().primaryKey(),
  tenant_id: model.text(),
  // Grocery-domain metadata only:
  storage_type: model.enum(["ambient", "chilled", "frozen", "live"]),
  shelf_life_days: model.number(),
  optimal_temp_min: model.number().nullable(),
  optimal_temp_max: model.number().nullable(),
  origin_country: model.text().nullable(),
  organic: model.boolean().default(false),
  unit_type: model.enum(["piece", "kg", "gram", "liter", "bunch", "pack"]),
  min_order_quantity: model.number().default(1),
  is_seasonal: model.boolean().default(false),
  season_start: model.text().nullable(),
  season_end: model.text().nullable(),
  nutrition_info: model.json().nullable(),
  metadata: model.json().nullable(),
});

export default FreshProduct;
