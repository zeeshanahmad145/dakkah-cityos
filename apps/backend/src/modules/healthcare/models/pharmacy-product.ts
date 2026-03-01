import { model } from "@medusajs/framework/utils";

/**
 * PharmacyProduct stores clinical metadata only.
 * Catalog (name/images), pricing, and inventory (stock) are in Medusa modules
 * via src/links/product-pharmacy.ts
 * COMPLIANCE NOTE: controlled_substance_schedule and prescription requirements
 * must be enforced at the API middleware level before checkout.
 */
const PharmacyProduct = model.define("pharmacy_product", {
  id: model.id().primaryKey(),
  tenant_id: model.text(),
  // REMOVED: product_id (bare), name, price, currency_code, stock_quantity
  // → these are now in Medusa Product + PriceSet + Inventory
  generic_name: model.text().nullable(),
  manufacturer: model.text().nullable(),
  dosage_form: model.enum([
    "tablet",
    "capsule",
    "liquid",
    "injection",
    "topical",
    "inhaler",
    "patch",
    "other",
  ]),
  strength: model.text().nullable(),
  requires_prescription: model.boolean().default(false),
  controlled_substance_schedule: model.text().nullable(), // I, II, III, IV, V, OTC
  storage_instructions: model.text().nullable(),
  side_effects: model.json().nullable(),
  contraindications: model.json().nullable(),
  expiry_date: model.dateTime().nullable(),
  is_active: model.boolean().default(true),
  metadata: model.json().nullable(),
});

export default PharmacyProduct;
