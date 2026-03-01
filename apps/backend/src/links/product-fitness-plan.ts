import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import FitnessModule from "../modules/fitness";

/**
 * Links a Medusa Product to a GymMembership plan.
 * Membership tiers (Basic, Premium, VIP) are product variants;
 * Medusa pricing engine manages billing intervals via price lists.
 */
export default defineLink(
  ProductModule.linkable.product,
  FitnessModule.linkable.gymMembership,
);
