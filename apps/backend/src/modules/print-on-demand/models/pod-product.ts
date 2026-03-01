import { model } from "@medusajs/framework/utils";

/**
 * PodProduct stores print-on-demand domain metadata only.
 * Catalog (title, description, images) and retail_price are in Medusa Product + PriceSet
 * via src/links/product-pod.ts
 * base_cost is retained for margin calculation (supplier cost vs retail_price).
 * status is removed — managed via Medusa Product.status.
 */
const PodProduct = model.define("pod_product", {
  id: model.id().primaryKey(),
  tenant_id: model.text().nullable(),
  // REMOVED: title, description, product_id (bare), retail_price, status
  // → these are now in Medusa Product + PriceSet via defineLink
  template_url: model.text(),
  print_provider: model.text().nullable(), // "printify", "printful", "custom"
  customization_options: model.json().nullable(),
  base_cost: model.number(), // Supplier cost in minor currency units
  metadata: model.json().nullable(),
});

export default PodProduct;
