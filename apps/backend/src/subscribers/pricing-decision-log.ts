import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { PRICING_RESOLVER_MODULE } from "../modules/pricing-resolver";
import type PricingResolverModuleService from "../modules/pricing-resolver/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:pricing-decision-log");

export default async function pricingDecisionLog({
  event,
  container,
}: SubscriberArgs<{
  id: string;
  customer_id?: string;
  company_id?: string;
  items?: any[];
  currency_code?: string;
}>) {
  const pricingService: PricingResolverModuleService = container.resolve(
    PRICING_RESOLVER_MODULE,
  );
  const { id, customer_id, company_id, items = [], currency_code } = event.data;

  for (const item of items) {
    try {
      const basePrice = item.unit_price ?? 0;
      const finalPrice = item.unit_price ?? 0; // In real impl: compare to original_price or discount fields

      // We log the pricing decision for audit — in production this receives pre-computed
      // rule data from the cart pricing pipeline
      await pricingService.logDecision({
        orderId: id,
        productId: item.product_id ?? item.id,
        variantId: item.variant_id,
        customerId: customer_id,
        companyId: company_id,
        quantity: item.quantity ?? 1,
        basePrice,
        finalPrice,
        currencyCode: currency_code ?? "SAR",
        appliedRules: item.pricing_rules ?? [],
        winningRuleType: item.winning_rule_type ?? "base_price",
      });
    } catch (err) {
      logger.error(
        `Pricing decision log error for item ${item.id}: ${String(err)}`,
      );
    }
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed"],
};
