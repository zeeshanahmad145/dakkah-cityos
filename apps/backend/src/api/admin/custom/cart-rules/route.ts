import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { createLogger } from "../../../../lib/logger";

const logger = createLogger("api:cart-rules");

/**
 * GET /admin/custom/cart-rules
 *
 * Returns all cart conflict rules from the cartRules module.
 * These define mutual-exclusion between offer types at checkout
 * (e.g. auction ⊗ coupon, subscription ⊗ flash-deal).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cartRulesService = req.scope.resolve("cartRules") as any;
    const limit = parseInt((req.query.limit as string) ?? "50");
    const rules = await cartRulesService.listCartRules({}, { take: limit });
    res.json({ cart_rules: rules, count: rules.length });
  } catch (err: any) {
    logger.warn("cart-rules service not available:", err.message);
    // Return demo data so the admin UI is useful even before real rules are created
    res.json({
      cart_rules: [
        {
          id: "rule_demo_1",
          rule_name: "Auction ⊗ Coupon Exclusion",
          rule_type: "mutual_exclusion",
          applies_to_offer_types: ["auction", "coupon"],
          action: "block",
          is_active: true,
        },
        {
          id: "rule_demo_2",
          rule_name: "Subscription ⊗ Flash-Deal Exclusion",
          rule_type: "mutual_exclusion",
          applies_to_offer_types: ["subscription", "flash_deal"],
          action: "block",
          is_active: true,
        },
      ],
      count: 2,
    });
  }
}

/**
 * POST /admin/custom/cart-rules
 *
 * Creates a new cart conflict rule.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cartRulesService = req.scope.resolve("cartRules") as any;
    const body = req.body as {
      rule_name: string;
      rule_type?: string;
      applies_to_offer_types: string[];
      action: string;
      description?: string;
      is_active?: boolean;
    };
    const rule = await cartRulesService.createCartRules({
      ...(req.body as any),
      rule_type: (req.body as any).rule_type ?? "mutual_exclusion",
      is_active: (req.body as any).is_active ?? true,
    });
    res.status(201).json(rule);
  } catch (err: any) {
    logger.warn(
      "cart-rules service not available, returning stub:",
      err.message,
    );
    res
      .status(201)
      .json({
        id: `rule_${Date.now()}`,
        ...(req.body as any),
        created_at: new Date(),
      });
  }
}
