import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import VolumePricingModule from "../modules/volume-pricing";

/**
 * Links a Medusa Product to a VolumePricing rule.
 * Volume pricing rules apply to specific products/variants through Medusa's
 * Price List feature. This link enables the admin UI and remoteQuery to
 * surface which price rules apply to a given product.
 *
 * isList: true — a product can have multiple volume pricing rules (tiered).
 */
export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  VolumePricingModule.linkable.volumePricing,
);
