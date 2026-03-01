import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import RestaurantModule from "../modules/restaurant";

/**
 * Links a Medusa Product to a MenuItem extension.
 * Menu items appear in the Medusa product catalog and use native pricing/inventory.
 * MenuItem retains restaurant-domain metadata: allergens, dietary_tags,
 * calories, prep_time, and menu_id (organizes into sections).
 * Product variants represent portion sizes (e.g., Small, Regular, Large).
 */
export default defineLink(
  ProductModule.linkable.product,
  RestaurantModule.linkable.menuItem,
);
