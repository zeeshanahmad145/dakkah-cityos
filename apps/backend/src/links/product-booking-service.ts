import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import BookingModule from "../modules/booking";

/**
 * Links a Medusa Product to a ServiceProduct extension.
 * This enables bookable services to appear in the Medusa product catalog
 * and be purchased through the native cart → checkout flow.
 * When an order is placed, the order-to-booking subscriber creates the booking record.
 */
export default defineLink(
  ProductModule.linkable.product,
  BookingModule.linkable.serviceProduct,
);
