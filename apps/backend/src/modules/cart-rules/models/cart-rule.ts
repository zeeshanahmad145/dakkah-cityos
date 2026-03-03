import { model } from "@medusajs/framework/utils";

/**
 * CartRule defines a conflict or restriction between two product types in a cart.
 * The cart validation API checks all rules before allowing checkout.
 */
const CartRule = model.define("cart_rule", {
  id: model.id().primaryKey(),
  // rule_type: conflict | restriction | requirement
  rule_type: model
    .enum(["conflict", "restriction", "requirement"])
    .default("conflict"),
  // source_product_type: auction | subscription | booking | bundle | flash_deal | membership | regular
  source_product_type: model.text(),
  // conflicting_product_type: the type that cannot coexist with source in the same cart
  conflicting_product_type: model.text().nullable(),
  // conflicting_feature: coupon | discount | custom_item_price | free_shipping
  conflicting_feature: model.text().nullable(),
  // error_message: user-facing explanation shown in cart
  error_message: model.text(),
  // priority: higher priority rules are applied first
  priority: model.number().default(10),
  is_active: model.boolean().default(true),
  tenant_id: model.text().nullable(),
});

export { CartRule };
