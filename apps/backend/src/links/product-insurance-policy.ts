import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import InsuranceModule from "../modules/insurance";

/**
 * Links a Medusa Product to an InsurancePolicy.
 * Insurance plans (Health, Auto, Property) are Medusa products with variants
 * per coverage tier. The premium amount is in the PriceSet.
 * InsurancePolicy retains domain fields: coverage_amount, start/end dates,
 * policy_number, claim status. Already has order_id field — very close to ideal.
 */
export default defineLink(
  ProductModule.linkable.product,
  InsuranceModule.linkable.insPolicy,
);
