import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import SubscriptionModule from "../modules/subscription";

/**
 * Links a Medusa Product to a SubscriptionPlan.
 * Each subscription tier (Basic, Pro, Enterprise) is a Medusa product with
 * billing intervals as product variants. Medusa's payment module handles
 * recurring billing; SubscriptionPlan keeps domain metadata:
 * billing_interval, trial_period_days, features, limits, included_products.
 *
 * NOTE: stripe_price_id and stripe_product_id are retained during transition —
 * they will be deprecated once Medusa payment module handles the full flow.
 */
export default defineLink(
  ProductModule.linkable.product,
  SubscriptionModule.linkable.subscriptionPlan,
);
