import { model } from "@medusajs/framework/utils";

/**
 * PetProduct stores pet-specific metadata only.
 * Catalog (name/images/status) and pricing are in Medusa Product + PriceSet
 * via src/links/product-pet-service.ts
 * stock is tracked by @medusajs/inventory.
 */
const PetProduct = model.define("pet_product", {
  id: model.id().primaryKey(),
  tenant_id: model.text(),
  // REMOVED: product_id (bare string) — managed by defineLink join table
  // REMOVED: name — in Medusa Product.title
  // REMOVED: price, currency_code — in Medusa PriceSet
  category: model.enum([
    "food",
    "treats",
    "toys",
    "accessories",
    "health",
    "grooming",
    "housing",
  ]),
  species_tags: model.json().nullable(), // ["dog", "cat", "bird"]
  breed_specific: model.text().nullable(),
  age_group: model
    .enum(["puppy_kitten", "adult", "senior", "all_ages"])
    .default("all_ages"),
  weight_range: model.json().nullable(), // { min: 0, max: 10, unit: "kg" }
  ingredients: model.json().nullable(),
  nutritional_info: model.json().nullable(),
  is_prescription_required: model.boolean().default(false),
  is_active: model.boolean().default(true),
  metadata: model.json().nullable(),
});

export default PetProduct;
