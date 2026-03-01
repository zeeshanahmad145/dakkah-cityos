import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import RealEstateModule from "../modules/real-estate";

/**
 * Links a Medusa Product to a PropertyListing.
 * Properties for sale or rent are Medusa products; sale price or monthly rent
 * is stored in the PriceSet. PropertyListing keeps real-estate-domain metadata:
 * address, bedrooms, bathrooms, sqm, property type, amenities, listing agent.
 * Soft enquiry → cart line item; transaction → order fulfillment flow.
 */
export default defineLink(
  ProductModule.linkable.product,
  RealEstateModule.linkable.propertyListing,
);
