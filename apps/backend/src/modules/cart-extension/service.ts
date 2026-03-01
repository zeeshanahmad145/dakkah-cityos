import { MedusaService } from "@medusajs/framework/utils";
import CartMetadata from "./models/cart-metadata";

type CartMetadataRecord = {
  id: string;
  cart_id: string;
  tenant_id: string;
  gift_wrap: boolean;
  gift_message: string | null;
  delivery_instructions: string | null;
  preferred_delivery_date: Date | null;
  special_handling: string | null;
  source_channel: string | null;
  metadata: Record<string, unknown> | null;
};

type CartItem = {
  id: string;
  product_id?: string;
  quantity: number;
  unit_price?: number;
  title?: string;
  compare_at_unit_price?: number;
  original_price?: number;
  weight?: number;
  metadata?: Record<string, unknown>;
};

type CartLike = { id: string; items?: CartItem[] };

interface CartExtensionServiceBase {
  listCartMetadatas(
    filters: Record<string, unknown>,
  ): Promise<CartMetadataRecord[]>;
  createCartMetadatas(
    data: Record<string, unknown>,
  ): Promise<CartMetadataRecord>;
  updateCartMetadatas(
    data: { id: string } & Record<string, unknown>,
  ): Promise<CartMetadataRecord>;
  retrieveCartMetadata(id: string): Promise<CartMetadataRecord>;
}

class CartExtensionModuleService extends MedusaService({
  CartMetadata,
}) {
  async getByCartId(
    cartId: string,
    tenantId: string,
  ): Promise<CartMetadataRecord | null> {
    const results = await (
      this as unknown as CartExtensionServiceBase
    ).listCartMetadatas({
      cart_id: cartId,
      tenant_id: tenantId,
    });
    const list = Array.isArray(results) ? results : [results].filter(Boolean);
    return list.length > 0 ? list[0] : null;
  }

  async setGiftWrap(
    cartId: string,
    tenantId: string,
    data: { enabled: boolean; message?: string },
  ): Promise<CartMetadataRecord> {
    const svc = this as unknown as CartExtensionServiceBase;
    const existing = await this.getByCartId(cartId, tenantId);

    if (existing) {
      await svc.updateCartMetadatas({
        id: existing.id,
        gift_wrap: data.enabled,
        gift_message: data.message ?? null,
      });
      return svc.retrieveCartMetadata(existing.id);
    }

    return svc.createCartMetadatas({
      cart_id: cartId,
      tenant_id: tenantId,
      gift_wrap: data.enabled,
      gift_message: data.message ?? null,
    });
  }

  async setDeliveryInstructions(
    cartId: string,
    tenantId: string,
    instructions: string,
  ): Promise<CartMetadataRecord> {
    const svc = this as unknown as CartExtensionServiceBase;
    const existing = await this.getByCartId(cartId, tenantId);

    if (existing) {
      await svc.updateCartMetadatas({
        id: existing.id,
        delivery_instructions: instructions,
      });
      return svc.retrieveCartMetadata(existing.id);
    }

    return svc.createCartMetadatas({
      cart_id: cartId,
      tenant_id: tenantId,
      delivery_instructions: instructions,
    });
  }

  private async fetchCart(cartId: string): Promise<CartLike | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const manager = (this as unknown as { manager_: any }).manager_;
      return await manager.findOne("cart", {
        where: { id: cartId },
        relations: ["items", "items.variant", "items.product"],
      });
    } catch {
      return null;
    }
  }

  async calculateCartTotals(cartId: string): Promise<{
    cartId: string;
    subtotal: number;
    tax: number;
    giftWrapCost: number;
    total: number;
    itemCount: number;
  } | null> {
    const cart = await this.fetchCart(cartId);
    if (!cart) return null;

    const items = cart.items ?? [];
    const subtotal = items.reduce(
      (sum, item) => sum + (item.unit_price ?? 0) * item.quantity,
      0,
    );
    const cartMeta = await this.getByCartId(cartId, "");
    const giftWrapCost = cartMeta?.gift_wrap ? 500 : 0;
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax + giftWrapCost;

    return {
      cartId,
      subtotal,
      tax,
      giftWrapCost,
      total,
      itemCount: items.length,
    };
  }

  async applyBulkDiscount(cartId: string): Promise<{
    cartId: string;
    itemCount: number;
    discountApplied: boolean;
    discountPercentage: number;
    discountAmount: number;
    appliedRule?: string;
  } | null> {
    const cart = await this.fetchCart(cartId);
    if (!cart || !cart.items || cart.items.length === 0) return null;

    const itemCount = cart.items.length;
    let discountPercentage = 0;
    if (itemCount >= 10) discountPercentage = 15;
    else if (itemCount >= 5) discountPercentage = 10;
    else if (itemCount >= 3) discountPercentage = 5;

    if (discountPercentage === 0) {
      return {
        cartId,
        itemCount,
        discountApplied: false,
        discountPercentage: 0,
        discountAmount: 0,
      };
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + (item.unit_price ?? 0) * item.quantity,
      0,
    );
    const discountAmount = Math.round(subtotal * (discountPercentage / 100));

    return {
      cartId,
      itemCount,
      discountApplied: true,
      discountPercentage,
      discountAmount,
      appliedRule: `bulk_${itemCount}_items`,
    };
  }

  async validateCartItems(cartId: string): Promise<{
    valid: boolean;
    itemCount: number;
    errors: string[];
    warnings?: string[];
    validated?: boolean;
  }> {
    const cart = await this.fetchCart(cartId);
    if (!cart || !cart.items) {
      return {
        valid: false,
        itemCount: 0,
        errors: ["Cart not found or has no items"],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    cart.items.forEach((item, index) => {
      if (!item.quantity || item.quantity <= 0)
        errors.push(`Item ${index + 1}: Invalid quantity`);
      if (!item.unit_price || item.unit_price <= 0)
        errors.push(`Item ${index + 1}: Invalid price`);
      if (!item.product_id)
        errors.push(`Item ${index + 1}: Missing product reference`);
    });

    return {
      valid: errors.length === 0,
      itemCount: cart.items.length,
      errors,
      warnings,
      validated: true,
    };
  }

  async getCartWithExtensions(cartId: string): Promise<{
    id: string;
    items: Array<{
      id: string;
      product_id?: string;
      quantity: number;
      unit_price?: number;
      title?: string;
    }>;
    extensions: Record<string, unknown>;
    pricing: Record<string, unknown>;
    discount: Record<string, unknown>;
    metadata: Record<string, unknown>;
  } | null> {
    const cart = await this.fetchCart(cartId);
    if (!cart) return null;

    const [metadata, totals, discount] = await Promise.all([
      this.getByCartId(cartId, ""),
      this.calculateCartTotals(cartId),
      this.applyBulkDiscount(cartId),
    ]);

    return {
      id: cart.id,
      items: (cart.items ?? []).map((item) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        title: item.title,
      })),
      extensions: {
        giftWrap: metadata?.gift_wrap ?? false,
        giftMessage: metadata?.gift_message ?? null,
        deliveryInstructions: metadata?.delivery_instructions ?? null,
        preferredDeliveryDate: metadata?.preferred_delivery_date ?? null,
        specialHandling: metadata?.special_handling ?? null,
        sourceChannel: metadata?.source_channel ?? null,
      },
      pricing: totals ?? {},
      discount: discount ?? {},
      metadata: (metadata?.metadata as Record<string, unknown>) ?? {},
    };
  }

  async applyGiftWrap(
    cartId: string,
    giftMessage: string,
  ): Promise<CartMetadataRecord> {
    if (!cartId) throw new Error("Cart ID is required");
    if (giftMessage && giftMessage.length > 500) {
      throw new Error("Gift message cannot exceed 500 characters");
    }

    const svc = this as unknown as CartExtensionServiceBase;
    const existing = await this.getByCartId(cartId, "");

    if (existing) {
      await svc.updateCartMetadatas({
        id: existing.id,
        gift_wrap: true,
        gift_message: giftMessage || null,
      });
      return svc.retrieveCartMetadata(existing.id);
    }

    return svc.createCartMetadatas({
      cart_id: cartId,
      tenant_id: "",
      gift_wrap: true,
      gift_message: giftMessage || null,
    });
  }

  async calculateCartSavings(cartId: string): Promise<{
    cartId: string;
    originalTotal: number;
    discountTotal: number;
    savings: number;
    savingsPercentage: number;
  }> {
    const empty = {
      cartId,
      originalTotal: 0,
      discountTotal: 0,
      savings: 0,
      savingsPercentage: 0,
    };
    try {
      const cart = await this.fetchCart(cartId);
      if (!cart || !cart.items || cart.items.length === 0) return empty;

      const items = cart.items;
      const originalTotal = items.reduce((sum, item) => {
        const compare =
          item.compare_at_unit_price ??
          item.original_price ??
          item.unit_price ??
          0;
        return sum + compare * item.quantity;
      }, 0);

      const discountTotal = items.reduce(
        (sum, item) => sum + (item.unit_price ?? 0) * item.quantity,
        0,
      );
      const bulkDiscount = await this.applyBulkDiscount(cartId);
      const bulkSavings = bulkDiscount?.discountAmount ?? 0;
      const savings = Math.max(0, originalTotal - discountTotal) + bulkSavings;
      const savingsPercentage =
        originalTotal > 0
          ? Math.round((savings / originalTotal) * 10000) / 100
          : 0;

      return {
        cartId,
        originalTotal,
        discountTotal: discountTotal - bulkSavings,
        savings,
        savingsPercentage,
      };
    } catch {
      return empty;
    }
  }

  async validateCartForCheckout(
    cartId: string,
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const itemValidation = await this.validateCartItems(cartId);
    if (!itemValidation.valid) errors.push(...itemValidation.errors);
    if (itemValidation.itemCount === 0) errors.push("Cart is empty");

    const metadata = await this.getByCartId(cartId, "");
    if (metadata?.gift_wrap && !metadata?.gift_message) {
      warnings.push("Gift wrap is enabled but no gift message was provided");
    }

    const totals = await this.calculateCartTotals(cartId);
    if (totals && totals.total <= 0)
      errors.push("Cart total must be greater than zero");

    return { valid: errors.length === 0, errors, warnings };
  }

  async calculateCartInsights(cartId: string): Promise<{
    cartId: string;
    savings: {
      originalTotal: number;
      currentTotal: number;
      totalSavings: number;
      savingsPercentage: number;
    };
    recommendations: Array<{
      type: string;
      message: string;
      potentialSaving: number;
    }>;
    loyaltyPoints: { potential: number; multiplier: number; tierBonus: number };
  }> {
    const empty = {
      cartId,
      savings: {
        originalTotal: 0,
        currentTotal: 0,
        totalSavings: 0,
        savingsPercentage: 0,
      },
      recommendations: [],
      loyaltyPoints: { potential: 0, multiplier: 1, tierBonus: 0 },
    };

    try {
      const cart = await this.fetchCart(cartId);
      if (!cart || !cart.items || cart.items.length === 0) return empty;

      const items = cart.items;
      const originalTotal = items.reduce((sum, item) => {
        const compare =
          item.compare_at_unit_price ??
          item.original_price ??
          item.unit_price ??
          0;
        return sum + compare * item.quantity;
      }, 0);
      const currentTotal = items.reduce(
        (sum, item) => sum + (item.unit_price ?? 0) * item.quantity,
        0,
      );
      const totalSavings = Math.max(0, originalTotal - currentTotal);
      const savingsPercentage =
        originalTotal > 0
          ? Math.round((totalSavings / originalTotal) * 10000) / 100
          : 0;

      const recommendations: Array<{
        type: string;
        message: string;
        potentialSaving: number;
      }> = [];

      if (items.length === 2) {
        recommendations.push({
          type: "bundle_suggestion",
          message: "Add one more item to qualify for a 5% bulk discount",
          potentialSaving: Math.round(currentTotal * 0.05),
        });
      }

      if (currentTotal > 0 && currentTotal < 5000) {
        recommendations.push({
          type: "free_shipping",
          message: `Add ${((5000 - currentTotal) / 100).toFixed(2)} more to qualify for free shipping`,
          potentialSaving: 500,
        });
      }

      const basePoints = Math.floor(currentTotal / 100);
      const multiplier = items.length >= 5 ? 2 : 1;
      const tierBonus = items.length >= 10 ? 50 : 0;

      return {
        cartId,
        savings: {
          originalTotal,
          currentTotal,
          totalSavings,
          savingsPercentage,
        },
        recommendations,
        loyaltyPoints: {
          potential: basePoints * multiplier + tierBonus,
          multiplier,
          tierBonus,
        },
      };
    } catch {
      return empty;
    }
  }

  async applyBundleDiscounts(cartId: string): Promise<{
    cartId: string;
    bundlesDetected: Array<{ name: string; items: string[]; discount: number }>;
    totalBundleDiscount: number;
    applied: boolean;
  }> {
    const empty = {
      cartId,
      bundlesDetected: [],
      totalBundleDiscount: 0,
      applied: false,
    };
    try {
      const cart = await this.fetchCart(cartId);
      if (!cart || !cart.items || cart.items.length === 0) return empty;

      const items = cart.items;
      const bundlesDetected: Array<{
        name: string;
        items: string[];
        discount: number;
      }> = [];
      const productGroups: Record<string, CartItem[]> = {};

      for (const item of items) {
        const category = (item.metadata?.category as string) ?? "general";
        if (!productGroups[category]) productGroups[category] = [];
        productGroups[category].push(item);
      }

      for (const [category, groupItems] of Object.entries(productGroups)) {
        if (groupItems.length >= 2) {
          const groupTotal = groupItems.reduce(
            (sum, item) => sum + (item.unit_price ?? 0) * item.quantity,
            0,
          );
          bundlesDetected.push({
            name: `${category}_bundle`,
            items: groupItems.map((i) => i.id),
            discount: Math.round(groupTotal * 0.1),
          });
        }
      }

      if (items.length >= 3) {
        const subtotal = items.reduce(
          (sum, item) => sum + (item.unit_price ?? 0) * item.quantity,
          0,
        );
        bundlesDetected.push({
          name: "mix_and_match",
          items: items.map((i) => i.id),
          discount: Math.round(subtotal * 0.05),
        });
      }

      const totalBundleDiscount = bundlesDetected.reduce(
        (sum, b) => sum + b.discount,
        0,
      );

      return {
        cartId,
        bundlesDetected,
        totalBundleDiscount,
        applied: bundlesDetected.length > 0,
      };
    } catch {
      return empty;
    }
  }

  async validateCartLimits(
    cartId: string,
    tenantId: string,
  ): Promise<{
    valid: boolean;
    cartId: string;
    checks: Array<{
      rule: string;
      passed: boolean;
      message: string;
      current: number;
      limit: number;
    }>;
  }> {
    try {
      const cart = await this.fetchCart(cartId);
      if (!cart || !cart.items) {
        return {
          valid: false,
          cartId,
          checks: [
            {
              rule: "cart_exists",
              passed: false,
              message: "Cart not found",
              current: 0,
              limit: 0,
            },
          ],
        };
      }

      const items = cart.items;
      const checks: Array<{
        rule: string;
        passed: boolean;
        message: string;
        current: number;
        limit: number;
      }> = [];

      const maxItems = 50;
      const totalItems = items.reduce(
        (sum, item) => sum + (item.quantity ?? 0),
        0,
      );
      checks.push({
        rule: "max_items",
        passed: totalItems <= maxItems,
        message:
          totalItems <= maxItems
            ? "Item count within limit"
            : `Cart exceeds maximum of ${maxItems} items`,
        current: totalItems,
        limit: maxItems,
      });

      const maxWeight = 50000;
      const totalWeight = items.reduce((sum, item) => {
        const weight = item.weight ?? (item.metadata?.weight as number) ?? 0;
        return sum + weight * (item.quantity ?? 0);
      }, 0);
      checks.push({
        rule: "max_weight",
        passed: totalWeight <= maxWeight,
        message:
          totalWeight <= maxWeight
            ? "Weight within limit"
            : `Cart exceeds maximum weight of ${maxWeight}g`,
        current: totalWeight,
        limit: maxWeight,
      });

      const maxValue = 10000000;
      const totalValue = items.reduce(
        (sum, item) => sum + (item.unit_price ?? 0) * (item.quantity ?? 0),
        0,
      );
      checks.push({
        rule: "max_value",
        passed: totalValue <= maxValue,
        message:
          totalValue <= maxValue
            ? "Cart value within limit"
            : "Cart exceeds maximum value",
        current: totalValue,
        limit: maxValue,
      });

      const maxPerItem = 20;
      for (const item of items) {
        if ((item.quantity ?? 0) > maxPerItem) {
          checks.push({
            rule: "max_per_item",
            passed: false,
            message: `Item ${item.id} exceeds per-item limit of ${maxPerItem}`,
            current: item.quantity,
            limit: maxPerItem,
          });
        }
      }

      return { valid: checks.every((c) => c.passed), cartId, checks };
    } catch {
      return {
        valid: false,
        cartId,
        checks: [
          {
            rule: "validation_error",
            passed: false,
            message: "Failed to validate cart limits",
            current: 0,
            limit: 0,
          },
        ],
      };
    }
  }

  async mergeGuestCart(
    guestCartId: string,
    customerCartId: string,
  ): Promise<{
    sourceGuestCartId: string;
    targetCustomerCartId: string;
    itemsMerged: number;
    totalItems: number;
    duplicatesHandled: number;
    extensionsMigrated: boolean;
  } | null> {
    try {
      const [guestCart, customerCart] = await Promise.all([
        this.fetchCart(guestCartId),
        this.fetchCart(customerCartId),
      ]);

      if (!guestCart || !customerCart) return null;

      const guestItems = guestCart.items ?? [];
      const customerItems = customerCart.items ?? [];
      const mergedItems = [...customerItems];
      const existingProductIds = new Set(
        customerItems.map((i) => i.product_id),
      );

      for (const guestItem of guestItems) {
        if (existingProductIds.has(guestItem.product_id)) {
          const existing = mergedItems.find(
            (i) => i.product_id === guestItem.product_id,
          );
          if (existing) existing.quantity += guestItem.quantity;
        } else {
          mergedItems.push({ ...guestItem, id: "" });
        }
      }

      const guestMeta = await this.getByCartId(guestCartId, "");

      if (guestMeta) {
        await this.setGiftWrap(customerCartId, "", {
          enabled: guestMeta.gift_wrap,
          message: guestMeta.gift_message ?? undefined,
        });
        if (guestMeta.delivery_instructions) {
          await this.setDeliveryInstructions(
            customerCartId,
            "",
            guestMeta.delivery_instructions,
          );
        }
      }

      return {
        sourceGuestCartId: guestCartId,
        targetCustomerCartId: customerCartId,
        itemsMerged: guestItems.length,
        totalItems: mergedItems.length,
        duplicatesHandled:
          customerItems.length > 0
            ? guestItems.length - (mergedItems.length - customerItems.length)
            : 0,
        extensionsMigrated: !!guestMeta,
      };
    } catch {
      return null;
    }
  }
}

export default CartExtensionModuleService;
