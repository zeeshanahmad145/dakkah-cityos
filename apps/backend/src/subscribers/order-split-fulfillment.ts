import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { FULFILLMENT_LEGS_MODULE } from "../modules/fulfillment-legs";
import type FulfillmentLegsModuleService from "../modules/fulfillment-legs/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:order-split-fulfillment");

/**
 * Triggered on order.placed for multi-vendor orders.
 * Reads the vendor distribution from order metadata and creates fulfillment legs.
 *
 * metadata.fulfillment_legs expected format:
 * [
 *   { items: [{variant_id, quantity}], vendor_id, warehouse_id, releases_escrow_percent },
 *   ...
 * ]
 */
export default async function orderSplitFulfillment({
  event,
  container,
}: SubscriberArgs<{ id: string; metadata?: Record<string, any> }>) {
  const { id: orderId, metadata } = event.data;

  // Only process orders that explicitly have multi-leg fulfillment specs
  const legSpecs = metadata?.fulfillment_legs;
  if (!legSpecs || !Array.isArray(legSpecs) || legSpecs.length <= 1) return;

  const fulfillmentLegsService: FulfillmentLegsModuleService =
    container.resolve(FULFILLMENT_LEGS_MODULE);

  try {
    const legs = await fulfillmentLegsService.createLegsForOrder(
      orderId,
      legSpecs,
    );
    logger.info(
      `Order ${orderId}: ${legs.length} fulfillment legs created and dispatched`,
    );
  } catch (err) {
    logger.error(
      `Order split fulfillment failed for order ${orderId}: ${String(err)}`,
    );
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed"],
};
