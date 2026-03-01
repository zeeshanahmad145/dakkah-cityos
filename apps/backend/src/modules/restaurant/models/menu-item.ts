import { model } from "@medusajs/framework/utils";

/**
 * MenuItem stores restaurant-domain metadata only.
 * Catalog (name/images/availability/status) and pricing are in Medusa Product + PriceSet
 * via src/links/product-menu-item.ts
 * Product variants can represent portion sizes (Small / Regular / Large).
 */
const MenuItem = model.define("menu_item", {
  id: model.id().primaryKey(),
  tenant_id: model.text(),
  menu_id: model.text(), // Reference to the Restaurant Menu section
  // REMOVED: product_id (bare), name, price, currency_code, image_url, is_available
  // → these are now in Medusa Product + PriceSet
  category: model.text().nullable(), // Starters, Mains, Desserts, Drinks…
  is_featured: model.boolean().default(false),
  // Nutritional info (domain-specific)
  calories: model.number().nullable(),
  allergens: model.json().nullable(), // ["gluten", "nuts", "dairy"]
  dietary_tags: model.json().nullable(), // ["vegan", "halal", "keto"]
  prep_time_minutes: model.number().nullable(),
  display_order: model.number().default(0),
  metadata: model.json().nullable(),
});

export default MenuItem;
