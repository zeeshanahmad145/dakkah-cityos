import { defineLink } from "@medusajs/framework/utils";
import CustomerModule from "@medusajs/medusa/customer";
import AffiliateModule from "../modules/affiliate";

/**
 * Links a Medusa Customer to their Affiliate profile.
 * Enables retrieving affiliate details when viewing a customer record,
 * and querying which customer owns each affiliate account.
 */
export default defineLink(
  CustomerModule.linkable.customer,
  AffiliateModule.linkable.affiliate,
);
