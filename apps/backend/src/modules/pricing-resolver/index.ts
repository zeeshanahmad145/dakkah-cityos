import PricingResolverModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const PRICING_RESOLVER_MODULE = "pricingResolver";
export { PricingResolverModuleService };
export default Module(PRICING_RESOLVER_MODULE, {
  service: PricingResolverModuleService,
});
