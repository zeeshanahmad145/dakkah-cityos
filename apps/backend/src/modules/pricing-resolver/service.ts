import { MedusaService } from "@medusajs/framework/utils";
import { PricingDecision } from "./models/pricing-decision";

// Priority order (lower number = higher priority = wins)
const RULE_PRIORITY: Record<string, number> = {
  b2b_price_list: 1,
  subscription_tier: 2,
  volume_pricing: 3,
  node_override: 4,
  flash_deal: 5,
  promotion: 6,
  base_price: 99,
};

class PricingResolverModuleService extends MedusaService({ PricingDecision }) {
  /**
   * Resolve the final price for a product given all applicable pricing sources.
   * Returns the final price and a full audit trail of applied rules.
   */
  async resolve(params: {
    productId: string;
    variantId?: string;
    basePrice: number;
    quantity: number;
    currencyCode?: string;
    customerId?: string;
    companyId?: string;
    nodeId?: string;
    subscriptionTierPrice?: number;
    volumePricingBracket?: number | null;
    nodeOverridePrice?: number | null;
    activePromotionDelta?: number | null;
    b2bPriceListPrice?: number | null;
    flashDealPrice?: number | null;
    cartId?: string;
  }): Promise<{
    finalPrice: number;
    appliedRules: any[];
    winningRuleType: string;
  }> {
    const appliedRules: any[] = [];
    let finalPrice = params.basePrice;

    // Evaluate all sources, store as candidates sorted by priority
    const candidates: {
      priority: number;
      ruleType: string;
      price: number;
      reason: string;
    }[] = [];

    if (params.b2bPriceListPrice != null) {
      candidates.push({
        priority: RULE_PRIORITY.b2b_price_list,
        ruleType: "b2b_price_list",
        price: params.b2bPriceListPrice,
        reason: "B2B company price list",
      });
    }
    if (params.subscriptionTierPrice != null) {
      candidates.push({
        priority: RULE_PRIORITY.subscription_tier,
        ruleType: "subscription_tier",
        price: params.subscriptionTierPrice,
        reason: "Subscription tier pricing",
      });
    }
    if (params.volumePricingBracket != null && params.quantity > 1) {
      candidates.push({
        priority: RULE_PRIORITY.volume_pricing,
        ruleType: "volume_pricing",
        price: params.volumePricingBracket,
        reason: `Volume tier (qty: ${params.quantity})`,
      });
    }
    if (params.nodeOverridePrice != null) {
      candidates.push({
        priority: RULE_PRIORITY.node_override,
        ruleType: "node_override",
        price: params.nodeOverridePrice,
        reason: `Node ${params.nodeId} pricing override`,
      });
    }
    if (params.flashDealPrice != null) {
      candidates.push({
        priority: RULE_PRIORITY.flash_deal,
        ruleType: "flash_deal",
        price: params.flashDealPrice,
        reason: "Flash deal price",
      });
    }

    // Sort by priority, pick winner
    candidates.sort((a, b) => a.priority - b.priority);
    let winningRuleType = "base_price";

    if (candidates.length > 0) {
      const winner = candidates[0];
      finalPrice = winner.price;
      winningRuleType = winner.ruleType;
    }

    // Apply promotion as delta on top of resolved price
    if (
      params.activePromotionDelta != null &&
      params.activePromotionDelta < 0
    ) {
      finalPrice = Math.max(0, finalPrice + params.activePromotionDelta);
      appliedRules.push({
        priority: RULE_PRIORITY.promotion,
        ruleType: "promotion",
        delta: params.activePromotionDelta,
        reason: "Active promotion discount",
      });
    }

    // Build rule trace
    appliedRules.unshift(
      ...candidates.map((c) => ({
        priority: c.priority,
        ruleType: c.ruleType,
        price: c.price,
        delta: c.price - params.basePrice,
        reason: c.reason,
        applied: c.ruleType === winningRuleType,
      })),
      {
        priority: 99,
        ruleType: "base_price",
        price: params.basePrice,
        delta: 0,
        reason: "Base list price",
        applied: winningRuleType === "base_price",
      },
    );

    return { finalPrice, appliedRules, winningRuleType };
  }

  /**
   * Store a pricing decision for an order line item.
   */
  async logDecision(params: {
    orderId?: string;
    cartId?: string;
    productId: string;
    variantId?: string;
    customerId?: string;
    companyId?: string;
    nodeId?: string;
    quantity: number;
    basePrice: number;
    finalPrice: number;
    currencyCode?: string;
    appliedRules: any[];
    winningRuleType: string;
  }): Promise<any> {
    return this.createPricingDecisions({
      order_id: params.orderId ?? null,
      cart_id: params.cartId ?? null,
      product_id: params.productId,
      variant_id: params.variantId ?? null,
      customer_id: params.customerId ?? null,
      company_id: params.companyId ?? null,
      node_id: params.nodeId ?? null,
      quantity: params.quantity,
      base_price: params.basePrice,
      final_price: params.finalPrice,
      currency_code: params.currencyCode ?? "SAR",
      applied_rules: params.appliedRules,
      winning_rule_type: params.winningRuleType,
      computed_at: new Date(),
    } as any);
  }
}

export default PricingResolverModuleService;
