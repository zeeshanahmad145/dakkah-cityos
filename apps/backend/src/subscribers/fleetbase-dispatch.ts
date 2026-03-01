import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { fleetDispatchWorkflow } from "../workflows/fleet-dispatch";

export default async function fleetbaseDispatchHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; order_id: string }>) {
  const logger = container.resolve("logger") as unknown as any;
  const orderId = data.order_id;
  const fulfillmentId = data.id;

  logger.info(
    `[FleetbaseDispatch] order.fulfillment_created received for Order ${orderId}. Preparing dispatch...`,
  );

  try {
    const query = container.resolve("query") as unknown as any;

    // 1. Fetch the order details, focusing on shipping address
    const { data: fulfillments } = await query.graph({
      entity: "fulfillment",
      fields: ["id", "delivery_address.*", "items.*", "order.id"],
      filters: { id: fulfillmentId },
    });

    const fulfillment = fulfillments?.[0];
    if (!fulfillment) {
      logger.warn(
        `[FleetbaseDispatch] Fulfillment ${fulfillmentId} not found, skipping dispatch.`,
      );
      return;
    }

    const deliveryAddress = fulfillment.delivery_address
      ? `${fulfillment.delivery_address.address_1}, ${fulfillment.delivery_address.city}, ${fulfillment.delivery_address.country_code}`
      : "Unknown Delivery Address";

    // Approximate weight from items (defaulting to 1kg if missing)
    const packageWeight =
      fulfillment.items?.reduce(
        (sum: number, item: any) => sum + (item.weight || 1),
        0,
      ) || 1;

    // Default Dakkah CityOS warehouse for pickup
    const pickupAddress = "Dakkah Core Warehouse, Riyadh, SA";

    // 2. Trigger the Fleetbase Workflow
    logger.info(
      `[FleetbaseDispatch] Executing Fleetbase workflow for Order ${orderId}...`,
    );

    await fleetDispatchWorkflow(container).run({
      input: {
        orderId: orderId || fulfillment.order?.id || "unknown",
        pickupAddress,
        deliveryAddress,
        packageWeight,
        priority: "standard", // or derived from shipping_option
        tenantId: "t_core", // or derived from order scope
        vehicle_type: packageWeight > 50 ? "truck" : "motorcycle",
      },
    });
  } catch (error: unknown) {
    logger.error(
      `[FleetbaseDispatch] Fleetbase dispatch workflow failed for Fulfillment ${data.id}: ${(error instanceof Error ? error.message : String(error))}`,
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
};
