import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import TradeInModule from "../modules/trade-in";

/**
 * Links a Medusa Product to a TradeInRequest.
 * Trade-ins apply to a specific product (the item being traded in).
 * Enables filtering trade-in requests by product in the admin panel.
 */
export default defineLink(
  ProductModule.linkable.product,
  TradeInModule.linkable.tradeInRequest,
);
