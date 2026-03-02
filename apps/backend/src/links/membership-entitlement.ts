import { defineLink } from "@medusajs/framework/utils";
import MembershipModule from "../modules/membership";
import EntitlementsModule from "../modules/entitlements";

export default defineLink(
  MembershipModule.linkable.membership,
  EntitlementsModule.linkable.entitlementPolicy,
);
