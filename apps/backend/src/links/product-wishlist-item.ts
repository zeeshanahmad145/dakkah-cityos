import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import WishlistModule from "../modules/wishlist";

/**
 * Links a Medusa Product to a WishlistItem.
 * WishlistItem already has product_id and variant_id as string references.
 * This defineLink provides proper relational integrity via the join table,
 * enabling queries like: "find all customers who wishlisted this product".
 * isList: true — a product can appear in many wishlists.
 */
export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  WishlistModule.linkable.wishlistItem,
);
