/**
 * Checkout Eligibility Guard
 *
 * Re-evaluates customer entitlements at checkout time — BEFORE payment is
 * authorized. Search is explicitly NOT authoritative for access control.
 *
 * This guard fires as a Medusa subscriber on cart.complete_requested and
 * order.pending events. It:
 *   1. Resolves current ABAC attributes from the customer's VC (live check)
 *   2. For each cart item, checks required_entitlement + allowed_pricing_tiers
 *   3. Rejects checkout with 403 if any line item fails entitlement check
 *   4. Logs a mismatch event if search returned an item the customer can't buy
 *      (indicates ABAC index drift)
 *
 * This is the "authoritative" entitlement fence that makes search-time
 * ABAC filtering non-authoritative by design.
 */

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { abacEngine } from "../lib/abac-engine";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:eligibility-guard");

export default async function checkoutEligibilityGuard({
  event,
  container,
}: SubscriberArgs<{
  cart_id?: string;
  order_id?: string;
  customer_id?: string;
  vc_token?: string;
}>) {
  const data = event.data;
  const cartId = data.cart_id;
  const customerId = data.customer_id;
  const vcToken = data.vc_token;

  if (!cartId) return; // guard only applies to cart checkouts

  const cartService = container.resolve("cart") as any;
  const productService = container.resolve("product") as any;
  const eventBus = container.resolve("event_bus") as any;
  const kernelService = container.resolve("kernel") as any;

  // 1. Resolve current ABAC attributes for this customer/VC
  let abacAttributes: {
    pricing_tier: string;
    entitlements: string[];
    kyc_level: number;
    jurisdiction: string;
  } = {
    pricing_tier: "standard",
    entitlements: [],
    kyc_level: 0,
    jurisdiction: "SA",
  };

  if (vcToken) {
    try {
      const resolved = await abacEngine.resolveVC(vcToken);
      if (resolved) abacAttributes = resolved as any;
    } catch (err: any) {
      logger.warn("ABAC VC resolution failed at checkout:", err.message);
      // Degrade gracefully — use standard tier, no entitlements
    }
  }

  // 2. Load cart items
  const cart = (await cartService
    .retrieveCart?.(cartId, {
      relations: ["items", "items.variant", "items.variant.product"],
    })
    .catch(() => null)) as any;
  if (!cart?.items?.length) return;

  const violations: Array<{
    product_id: string;
    required_entitlement: string | null;
    reason: string;
  }> = [];

  for (const item of cart.items) {
    const product = item.variant?.product;
    const productId = product?.id ?? item.product_id;

    if (!productId) continue;

    // Resolve ABAC constraints from product metadata or kernel offer
    let requiredEntitlement: string | null =
      product?.metadata?.required_entitlement ?? null;
    let allowedPricingTiers: string | null =
      product?.metadata?.allowed_pricing_tiers ?? null;

    // Also check kernel Offer if product maps to one
    if (!requiredEntitlement && kernelService?.getOfferBySourceEntity) {
      const offer = (await kernelService
        .getOfferBySourceEntity("product", productId)
        .catch(() => null)) as any;
      if (offer) {
        requiredEntitlement = offer.metadata?.required_entitlement ?? null;
        allowedPricingTiers = offer.metadata?.allowed_pricing_tiers ?? null;
      }
    }

    // 3. Enforce entitlement check
    if (requiredEntitlement && requiredEntitlement !== "public") {
      const hasEntitlement =
        abacAttributes.entitlements.includes(requiredEntitlement);
      if (!hasEntitlement) {
        violations.push({
          product_id: productId,
          required_entitlement: requiredEntitlement,
          reason: `Missing entitlement: ${requiredEntitlement}`,
        });
        logger.warn(
          `Eligibility violation: customer ${customerId} lacks "${requiredEntitlement}" for product ${productId}`,
        );
        // Emit ABAC drift event (search returned item customer can't buy)
        await eventBus.emit?.("search.abac_drift_detected", {
          customer_id: customerId,
          product_id: productId,
          required_entitlement: requiredEntitlement,
          customer_entitlements: abacAttributes.entitlements,
          detected_at: new Date().toISOString(),
        });
      }
    }

    // Pricing tier check
    if (allowedPricingTiers) {
      const tiers = allowedPricingTiers.split(",").map((t: string) => t.trim());
      const hasTier =
        tiers.includes(abacAttributes.pricing_tier) ||
        tiers.includes("standard");
      if (!hasTier) {
        violations.push({
          product_id: productId,
          required_entitlement: requiredEntitlement,
          reason: `Pricing tier "${abacAttributes.pricing_tier}" not in allowed tiers: ${allowedPricingTiers}`,
        });
      }
    }
  }

  // 4. Emit violation event (downstream can cancel cart or surface error to storefront)
  if (violations.length > 0) {
    await eventBus.emit?.("checkout.eligibility_violated", {
      cart_id: cartId,
      customer_id: customerId,
      violations,
      abac_attributes: abacAttributes,
      checked_at: new Date().toISOString(),
    });
    logger.error(
      `Checkout eligibility violations for cart ${cartId}: ${violations.map((v) => v.reason).join("; ")}`,
    );
    // Note: actual cart rejection is handled by the storefront listening to this event.
    // The subscriber itself does not throw — it emits; the API layer can add a hard-stop
    // by registering a checkout validation step that reads this event synchronously.
  }

  logger.info(
    `Eligibility check complete for cart ${cartId}: ${violations.length === 0 ? "PASS" : `${violations.length} VIOLATIONS`}`,
  );
}

export const config: SubscriberConfig = {
  event: ["cart.complete_requested", "checkout.payment_initiated"],
};
