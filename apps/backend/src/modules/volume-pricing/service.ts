import { MedusaService } from "@medusajs/framework/utils";
import VolumePricing from "./models/volume-pricing";
import VolumePricingTier from "./models/volume-pricing-tier";

/**
 * Volume Pricing Service
 *
 * Calculates quantity-based discounts for B2B orders.
 */
class VolumePricingModuleService extends MedusaService({
  VolumePricing,
  VolumePricingTier,
}) {
  /**
   * Find applicable volume pricing rules
   */
  async findApplicableRules(context: {
    productId?: string;
    variantId?: string;
    collectionId?: string;
    categoryId?: string;
    companyId?: string;
    companyTier?: string;
    regionId?: string;
    storeId?: string;
    tenantId: string;
  }) {
    interface VPFilter {
      status: string;
      tenant_id: string;
      $or?: Array<Record<string, unknown>>;
      $and?: Array<Record<string, unknown>>;
      [key: string]: unknown;
    }

    const now = new Date();
    const filters: VPFilter = {
      status: "active",
      tenant_id: context.tenantId,
      $or: [{ starts_at: null }, { starts_at: { $lte: now } }],
      $and: [
        {
          $or: [{ ends_at: null }, { ends_at: { $gte: now } }],
        },
      ],
    };

    // Store/Region scope
    if (context.storeId) {
      filters.$or = filters.$or || [];
      filters.$or.push({ store_id: context.storeId }, { store_id: null });
    }

    // Company scope
    if (context.companyId || context.companyTier) {
      filters.$or = filters.$or || [];
      if (context.companyId) {
        filters.$or.push({ company_id: context.companyId });
      }
      if (context.companyTier) {
        filters.$or.push({ company_tier: context.companyTier });
      }
      filters.$or.push({ company_id: null, company_tier: null });
    }

    // Product scope
    const scopeConditions: Array<Record<string, unknown>> = [
      { applies_to: "all" },
    ];

    if (context.variantId) {
      scopeConditions.push({
        applies_to: "variant",
        target_id: context.variantId,
      });
    }

    if (context.productId) {
      scopeConditions.push({
        applies_to: "product",
        target_id: context.productId,
      });
    }

    if (context.collectionId) {
      scopeConditions.push({
        applies_to: "collection",
        target_id: context.collectionId,
      });
    }

    if (context.categoryId) {
      scopeConditions.push({
        applies_to: "category",
        target_id: context.categoryId,
      });
    }

    filters.$or = [...(filters.$or || []), ...scopeConditions];

    const rules = (await this.listVolumePricings(filters)) as any;

    // Sort by priority (highest first)
    return (rules || []).sort(
      (a: any, b: any) => (b.priority || 0) - (a.priority || 0),
    );
  }

  /**
   * Calculate volume discount for a quantity
   */
  async calculateDiscount(
    ruleId: string,
    quantity: number,
    unitPrice: bigint,
    currencyCode: string = "usd",
  ): Promise<{
    discountPerUnit: bigint;
    discountTotal: bigint;
    finalUnitPrice: bigint;
    finalTotal: bigint;
    tier?: any;
  }> {
    const rule = (await this.retrieveVolumePricing(ruleId)) as any;
    const tiers = (await this.listVolumePricingTiers({
      volume_pricing_id: ruleId,
    })) as any;

    // Find matching tier
    const matchingTier = (tiers || [])
      .sort((a: any, b: any) => a.min_quantity - b.min_quantity)
      .find((tier) => {
        const inRange = quantity >= tier.min_quantity;
        const belowMax =
          tier.max_quantity === null || quantity <= tier.max_quantity;
        return inRange && belowMax;
      });

    if (!matchingTier) {
      // No tier matches, return original pricing
      return {
        discountPerUnit: 0n,
        discountTotal: 0n,
        finalUnitPrice: unitPrice,
        finalTotal: unitPrice * BigInt(quantity),
      };
    }

    let discountPerUnit = 0n;
    let finalUnitPrice = unitPrice;

    // Calculate discount based on type
    if (
      rule.pricing_type === "percentage" &&
      matchingTier.discount_percentage
    ) {
      discountPerUnit =
        (unitPrice *
          BigInt(Math.floor(matchingTier.discount_percentage * 100))) /
        10000n;
      finalUnitPrice = unitPrice - discountPerUnit;
    } else if (rule.pricing_type === "fixed" && matchingTier.discount_amount) {
      discountPerUnit = BigInt(matchingTier.discount_amount);
      finalUnitPrice = unitPrice - discountPerUnit;
    } else if (
      rule.pricing_type === "fixed_price" &&
      matchingTier.fixed_price
    ) {
      finalUnitPrice = BigInt(matchingTier.fixed_price);
      discountPerUnit = unitPrice - finalUnitPrice;
    }

    const discountTotal = discountPerUnit * BigInt(quantity);
    const finalTotal = finalUnitPrice * BigInt(quantity);

    return {
      discountPerUnit,
      discountTotal,
      finalUnitPrice,
      finalTotal,
      tier: matchingTier,
    };
  }

  /**
   * Get best volume pricing for a cart item
   */
  async getBestVolumePrice(context: {
    productId: string;
    variantId: string;
    quantity: number;
    unitPrice: bigint;
    currencyCode: string;
    companyId?: string;
    companyTier?: string;
    tenantId: string;
    storeId?: string;
  }) {
    const rules = await this.findApplicableRules({
      productId: context.productId,
      variantId: context.variantId,
      companyId: context.companyId,
      companyTier: context.companyTier,
      tenantId: context.tenantId,
      storeId: context.storeId,
    });

    let bestDiscount: any = null;
    let bestSavings = 0n;

    for (const rule of rules) {
      const discount = await this.calculateDiscount(
        rule.id,
        context.quantity,
        context.unitPrice,
        context.currencyCode,
      );

      if (discount.discountTotal > bestSavings) {
        bestSavings = discount.discountTotal;
        bestDiscount = {
          ...discount,
          rule,
        };
      }
    }

    return (
      bestDiscount || {
        discountPerUnit: 0n,
        discountTotal: 0n,
        finalUnitPrice: context.unitPrice,
        finalTotal: context.unitPrice * BigInt(context.quantity),
      }
    );
  }
}

export default VolumePricingModuleService;
