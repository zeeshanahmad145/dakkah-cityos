import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import QuoteModule from "../modules/quote";

/**
 * Links a Medusa Order to the Quote it was converted from.
 * When a B2B quote is accepted and converted to a cart → order,
 * this join table records the originating quote_id on the order.
 */
export default defineLink(
  OrderModule.linkable.order,
  QuoteModule.linkable.quote,
);
