import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { CART_RULES_MODULE } from "../../../../modules/cart-rules";
import type CartRulesModuleService from "../../../../modules/cart-rules/service";

/**
 * POST /store/cart/validate
 *
 * Call before proceeding to checkout to detect cart conflicts.
 * Body: { items: CartItem[], coupon_applied?: boolean, discount_applied?: boolean }
 * Returns: { valid: boolean, conflicts: [] }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cartRulesService = req.scope.resolve(
    CART_RULES_MODULE,
  ) as unknown as CartRulesModuleService;

  const body = req.body as {
    items?: Array<{
      product_type?: string;
      variant_id?: string;
      product_id?: string;
    }>;
    coupon_applied?: boolean;
    discount_applied?: boolean;
    tenant_id?: string;
  };

  const items = body.items ?? [];
  if (items.length === 0) {
    return res.json({ valid: true, conflicts: [] });
  }

  // Ensure default rules are seeded on first call
  await cartRulesService.seedDefaultRules();

  const result = await cartRulesService.validateCart(items, {
    couponApplied: body.coupon_applied ?? false,
    discountApplied: body.discount_applied ?? false,
    tenantId: body.tenant_id,
  });

  res.status(result.valid ? 200 : 409).json(result);
}
