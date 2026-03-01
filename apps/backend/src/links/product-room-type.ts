import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import TravelModule from "../modules/travel";

/**
 * Links a Medusa Product to a RoomType extension.
 * Hotel room types are Medusa products; rate plans are product variants with
 * PriceSet entries. Availability is managed via @medusajs/inventory.
 * RoomType retains hospitality domain metadata: capacity, bed config, amenities, view type.
 * On order.placed, the subscriber creates a Reservation record.
 */
export default defineLink(
  ProductModule.linkable.product,
  TravelModule.linkable.roomType,
);
