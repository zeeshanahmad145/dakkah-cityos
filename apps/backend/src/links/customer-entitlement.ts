import { defineLink } from "@medusajs/framework/utils";
import CustomerModule from "@medusajs/medusa/customer";
import EntitlementsModule from "../modules/entitlements";

export default defineLink(
  CustomerModule.linkable.customer,
  EntitlementsModule.linkable.entitlement,
);
