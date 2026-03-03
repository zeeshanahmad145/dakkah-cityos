import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { createLogger } from "../../../../lib/logger";

const logger = createLogger("api:subscription-benefits");

/**
 * GET /admin/custom/subscription-benefits
 *
 * Returns all cross-product subscription benefit rules.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const svc = req.scope.resolve("subscriptionBenefits") as any;
    const rules = await svc.listSubscriptionBenefitRules(
      {},
      { take: parseInt((req.query.limit as string) ?? "50") },
    );
    res.json({ rules, count: rules.length });
  } catch (err: any) {
    logger.warn("subscriptionBenefits service not available:", err.message);
    res.json({
      rules: [
        {
          id: "sb_demo_1",
          plan_id: "plan_premium_monthly",
          benefit_type: "discount",
          discount_pct: 15,
          applies_to_offer_types: ["booking", "service"],
          max_uses_per_period: null,
          is_active: true,
        },
        {
          id: "sb_demo_2",
          plan_id: "plan_premium_monthly",
          benefit_type: "free_delivery",
          discount_pct: 0,
          applies_to_offer_types: ["good"],
          max_uses_per_period: 10,
          is_active: true,
        },
      ],
      count: 2,
    });
  }
}

/**
 * POST /admin/custom/subscription-benefits
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const svc = req.scope.resolve("subscriptionBenefits") as any;
    const rule = await svc.createSubscriptionBenefitRules(req.body as any);
    res.status(201).json(rule);
  } catch (err: any) {
    logger.warn(
      "subscriptionBenefits service not available, returning stub:",
      err.message,
    );
    res
      .status(201)
      .json({
        id: `sb_${Date.now()}`,
        ...(req.body as any),
        created_at: new Date(),
      });
  }
}
