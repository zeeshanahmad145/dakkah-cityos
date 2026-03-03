import { MedusaService } from "@medusajs/framework/utils";
import { CartRule } from "./models/cart-rule";
import { createLogger } from "../../lib/logger";

const logger = createLogger("service:cart-rules");

type CartItem = {
  product_type?: string;
  coupon_applied?: boolean;
  has_discount?: boolean;
  variant_id?: string;
  product_id?: string;
};

type CartValidationResult = {
  valid: boolean;
  conflicts: Array<{
    source: string;
    conflict: string;
    message: string;
    rule_id: string;
  }>;
};

class CartRulesModuleService extends MedusaService({ CartRule }) {
  /**
   * Validate a cart's items against all active conflict rules.
   * Call this before checkout to catch pricing inconsistencies.
   */
  async validateCart(
    items: CartItem[],
    options: {
      tenantId?: string;
      couponApplied?: boolean;
      discountApplied?: boolean;
    } = {},
  ): Promise<CartValidationResult> {
    const rules = (await this.listCartRules({ is_active: true })) as any[];
    const conflicts: CartValidationResult["conflicts"] = [];

    const itemTypes = new Set(
      items.map((i) => i.product_type ?? "regular").filter(Boolean),
    );
    const hasFeature = (feature: string) => {
      if (feature === "coupon") return options.couponApplied ?? false;
      if (feature === "discount") return options.discountApplied ?? false;
      return false;
    };

    for (const rule of rules) {
      const sourcePresent = itemTypes.has(rule.source_product_type);
      if (!sourcePresent) continue;

      if (rule.rule_type === "conflict") {
        // Check product type conflict
        if (
          rule.conflicting_product_type &&
          itemTypes.has(rule.conflicting_product_type)
        ) {
          conflicts.push({
            source: rule.source_product_type,
            conflict: rule.conflicting_product_type,
            message: rule.error_message,
            rule_id: rule.id,
          });
        }
        // Check feature conflict (coupon, discount)
        if (rule.conflicting_feature && hasFeature(rule.conflicting_feature)) {
          conflicts.push({
            source: rule.source_product_type,
            conflict: rule.conflicting_feature,
            message: rule.error_message,
            rule_id: rule.id,
          });
        }
      }
    }

    logger.info(
      `Cart validated: ${conflicts.length} conflicts found for ${itemTypes.size} item types`,
    );
    return { valid: conflicts.length === 0, conflicts };
  }

  /**
   * Seed the default conflict matrix if no rules exist.
   */
  async seedDefaultRules(): Promise<void> {
    const existing = (await this.listCartRules({})) as any[];
    if (existing.length > 0) return;

    const defaults: Array<{
      source_product_type: string;
      conflicting_product_type?: string;
      conflicting_feature?: string;
      error_message: string;
      priority: number;
    }> = [
      {
        source_product_type: "auction",
        conflicting_feature: "coupon",
        error_message: "Coupon codes cannot be applied to auction items.",
        priority: 10,
      },
      {
        source_product_type: "auction",
        conflicting_feature: "discount",
        error_message: "Discounts cannot be applied to auction items.",
        priority: 10,
      },
      {
        source_product_type: "subscription",
        conflicting_product_type: "flash_deal",
        error_message:
          "Subscription items cannot be combined with flash deal items in the same order.",
        priority: 8,
      },
      {
        source_product_type: "booking",
        conflicting_product_type: "bundle",
        error_message:
          "Booking items cannot be combined with bundle products. Please place separate orders.",
        priority: 7,
      },
      {
        source_product_type: "flash_deal",
        conflicting_feature: "coupon",
        error_message:
          "Coupon codes cannot be stacked with flash deal pricing.",
        priority: 9,
      },
    ];

    await Promise.all(
      defaults.map((rule) =>
        this.createCartRules({
          ...rule,
          rule_type: "conflict",
          is_active: true,
        } as any),
      ),
    );
    logger.info("Default cart conflict rules seeded");
  }
}

export default CartRulesModuleService;
