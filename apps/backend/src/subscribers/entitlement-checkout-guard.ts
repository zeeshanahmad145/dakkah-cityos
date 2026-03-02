import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ENTITLEMENTS_MODULE } from "../modules/entitlements";
import type EntitlementsModuleService from "../modules/entitlements/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:entitlement-checkout-guard");

// Product types that require an active entitlement before purchase
const GATED_PRODUCT_TYPES = new Set([
  "exclusive_course_addon",
  "premium_content",
  "members_only",
  "subscription_addon",
]);

export default async function entitlementCheckoutGuard({
  event,
  container,
}: SubscriberArgs<{
  id: string;
  customer_id?: string;
  items?: Array<{
    id: string;
    product_id: string;
    product_type?: string;
    variant_id?: string;
  }>;
}>) {
  const entitlementsService: EntitlementsModuleService =
    container.resolve(ENTITLEMENTS_MODULE);
  const { customer_id, items = [] } = event.data;

  if (!customer_id) return;

  for (const item of items) {
    const productType = item.product_type ?? "";
    if (!GATED_PRODUCT_TYPES.has(productType)) continue;

    try {
      const result = await entitlementsService.check(
        customer_id,
        productType,
        item.product_id,
      );
      if (!result.entitled) {
        // In a real implementation this would throw to block the add-to-cart action
        // or emit cart.line_item_removed — Medusa v2 doesn't allow subscribers to mutate
        // so we log and let the checkout-gate API handle actual blocking
        logger.warn(
          `Customer ${customer_id} attempted to add gated product ${item.product_id} without entitlement`,
        );
        // Emit event for downstream monitoring
        const eventBus = container.resolve("eventBusService") as any;
        await eventBus.emit?.("entitlement.access_denied", {
          customer_id,
          product_id: item.product_id,
          required_entitlement_type: productType,
          cart_item_id: item.id,
        });
      }
    } catch (err) {
      logger.error(`Entitlement checkout guard error: ${String(err)}`);
    }
  }
}

export const config: SubscriberConfig = {
  event: ["cart.line_item_added"],
};
