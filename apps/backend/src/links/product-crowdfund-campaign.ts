import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import CrowdfundingModule from "../modules/crowdfunding";

/**
 * Links a Medusa Product to a CrowdfundCampaign.
 * The campaign's reward tiers, equity offers, or products are Medusa products
 * with variant-level pricing. The campaign itself stores goal/progress metadata.
 *
 * For donation campaigns, the "product" is a nominal donation amount product
 * (e.g., "Donate Any Amount") with a custom price input at checkout.
 */
export default defineLink(
  ProductModule.linkable.product,
  CrowdfundingModule.linkable.crowdfundCampaign,
);
