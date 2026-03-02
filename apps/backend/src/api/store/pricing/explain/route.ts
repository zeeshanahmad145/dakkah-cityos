import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { PRICING_RESOLVER_MODULE } from "../../../../modules/pricing-resolver";
import type PricingResolverModuleService from "../../../../modules/pricing-resolver/service";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const {
    product_id,
    quantity = "1",
    node_id,
    company_id,
  } = req.query as Record<string, string>;
  const customerId = (req as any).auth_context?.actor_id;

  if (!product_id) {
    return res.status(400).json({ error: "product_id is required" });
  }

  const pricingService: PricingResolverModuleService = req.scope.resolve(
    PRICING_RESOLVER_MODULE,
  );

  try {
    // Resolve base price from Medusa pricing
    const productService = req.scope.resolve("productService") as any;
    const product = await productService
      .retrieveProduct?.(product_id, { relations: ["variants"] })
      .catch(() => null);
    const basePrice =
      product?.variants?.[0]?.calculated_price?.calculated_amount ?? 0;

    const result = await pricingService.resolve({
      productId: product_id,
      basePrice,
      quantity: Number(quantity),
      currencyCode: "SAR",
      customerId,
      companyId: company_id,
      nodeId: node_id,
    });

    res.json({
      product_id,
      base_price: result.finalPrice === basePrice ? basePrice : basePrice,
      final_price: result.finalPrice,
      winning_rule: result.winningRuleType,
      explanation: result.appliedRules,
      currency_code: "SAR",
    });
  } catch {
    res.status(500).json({ error: "Price explanation unavailable" });
  }
}
