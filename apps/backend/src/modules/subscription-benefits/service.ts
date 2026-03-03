import { MedusaService } from "@medusajs/framework/utils";
import { SubscriptionBenefitRule } from "./models/subscription-benefit-rule";
import { createLogger } from "../../lib/logger";

const logger = createLogger("service:subscription-benefits");

class SubscriptionBenefitsModuleService extends MedusaService({
  SubscriptionBenefitRule,
}) {
  /**
   * Get all active benefits for a customer's active subscriptions.
   * Returns a map of product_type → best benefit.
   */
  async getBenefitsForCustomer(
    activePlanIds: string[],
    targetProductType?: string,
  ): Promise<
    Array<{
      plan_id: string;
      target_product_type: string;
      benefit_type: string;
      benefit_value: number;
    }>
  > {
    if (activePlanIds.length === 0) return [];

    // Fetch all active benefit rules for these plans
    const allRules = await Promise.all(
      activePlanIds.map((planId) =>
        this.listSubscriptionBenefitRules({
          plan_id: planId,
          is_active: true,
          ...(targetProductType
            ? { target_product_type: targetProductType }
            : {}),
        }),
      ),
    );

    const rules = allRules.flat() as any[];

    // De-duplicate: keep best benefit per product_type (highest benefit_value)
    const bestByType = new Map<string, any>();
    for (const rule of rules) {
      const key = rule.target_product_type;
      const existing = bestByType.get(key);
      if (!existing || rule.benefit_value > existing.benefit_value) {
        bestByType.set(key, rule);
      }
    }

    const result = [...bestByType.values()].map((r) => ({
      plan_id: r.plan_id,
      target_product_type: r.target_product_type,
      benefit_type: r.benefit_type,
      benefit_value: r.benefit_value,
    }));

    logger.info(
      `Subscription benefits: ${result.length} applicable for plans [${activePlanIds.join(", ")}]`,
    );
    return result;
  }

  /**
   * Apply a benefit (discount) to a price.
   * Returns the adjusted price.
   */
  applyBenefit(
    originalPrice: number,
    benefit: { benefit_type: string; benefit_value: number },
  ): number {
    switch (benefit.benefit_type) {
      case "discount":
        return originalPrice * (1 - benefit.benefit_value / 100);
      case "free_access":
        return 0;
      default:
        return originalPrice;
    }
  }
}

export default SubscriptionBenefitsModuleService;
