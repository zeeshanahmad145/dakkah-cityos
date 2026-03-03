import CartRulesModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const CART_RULES_MODULE = "cartRules";
export { CartRulesModuleService };

export default Module(CART_RULES_MODULE, {
  service: CartRulesModuleService,
});
