import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import PricingResolverModule from "../modules/pricing-resolver";

export default defineLink(
  OrderModule.linkable.order,
  PricingResolverModule.linkable.pricingDecision,
);
