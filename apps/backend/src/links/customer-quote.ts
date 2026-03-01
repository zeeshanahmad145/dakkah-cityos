import { defineLink } from "@medusajs/framework/utils";
import CustomerModule from "@medusajs/medusa/customer";
import QuoteModule from "../modules/quote";

/**
 * Links a Medusa Customer to a Quote (B2B RFQ).
 * Enables retrieving all quotes for a given customer via query.graph().
 */
export default defineLink(
  CustomerModule.linkable.customer,
  QuoteModule.linkable.quote,
);
