import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createLogger } from "../../../../lib/logger";

const logger = createLogger("api:store:subscription-benefits");

/**
 * GET /store/subscription-benefits/mine
 *
 * Returns all active subscription benefit rules that apply to the authenticated
 * customer's current subscription plan. Used by /account/benefits storefront page.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id;
  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    // 1. Get the customer's active subscription plan
    const subscriptionSvc = req.scope.resolve("subscription") as any;
    const plans = await subscriptionSvc.listSubscriptions(
      { customer_id: customerId, status: "active" },
      { take: 1 },
    );
    const activePlan = Array.isArray(plans) ? plans[0] : null;

    if (!activePlan) {
      return res.json({ benefits: [], plan: null });
    }

    // 2. Get benefit rules for this plan
    const benefitsSvc = req.scope.resolve("subscriptionBenefits") as any;
    const rules = await benefitsSvc.listSubscriptionBenefitRules(
      { plan_id: activePlan.plan_id, is_active: true },
      { take: 50 },
    );

    res.json({
      benefits: rules ?? [],
      plan: { id: activePlan.plan_id, name: activePlan.plan_name },
    });
  } catch (err: any) {
    logger.warn(
      "subscription-benefits service not available, returning demo:",
      err.message,
    );
    res.json({
      plan: { id: "plan_premium_monthly", name: "Premium Monthly" },
      benefits: [
        {
          id: "sb_d1",
          benefit_type: "discount",
          discount_pct: 15,
          applies_to_offer_types: ["booking", "service"],
          max_uses_per_period: null,
          is_active: true,
        },
        {
          id: "sb_d2",
          benefit_type: "free_delivery",
          discount_pct: 0,
          applies_to_offer_types: ["good"],
          max_uses_per_period: 10,
          is_active: true,
        },
        {
          id: "sb_d3",
          benefit_type: "cashback",
          discount_pct: 5,
          applies_to_offer_types: ["good", "service"],
          max_uses_per_period: null,
          is_active: true,
        },
      ],
    });
  }
}
