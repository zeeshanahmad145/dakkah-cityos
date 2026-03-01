import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import PrintOnDemandModule from "../modules/print-on-demand";

/**
 * Links a Medusa Product to a PodProduct extension.
 * Print-on-demand items are Medusa products (title, description, images from Printify/Printful);
 * retail_price is in the Medusa PriceSet; inventory is virtual (POD = made to order).
 * PodProduct stores print-specific metadata: template_url, print_provider,
 * customization_options, and base_cost (for margin calculation).
 */
export default defineLink(
  ProductModule.linkable.product,
  PrintOnDemandModule.linkable.podProduct,
);
