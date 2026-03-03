import SubscriptionBenefitsModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const SUBSCRIPTION_BENEFITS_MODULE = "subscriptionBenefits";
export { SubscriptionBenefitsModuleService };

export default Module(SUBSCRIPTION_BENEFITS_MODULE, {
  service: SubscriptionBenefitsModuleService,
});
