import { defineLink } from "@medusajs/framework/utils";
import SubscriptionModule from "../modules/subscription";
import EntitlementsModule from "../modules/entitlements";

export default defineLink(
  SubscriptionModule.linkable.subscriptionPlan,
  EntitlementsModule.linkable.entitlementPolicy,
);
