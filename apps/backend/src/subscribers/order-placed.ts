import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { syncInventoryToPayloadWorkflow } from "../workflows/sync-inventory-to-payload";
import { syncOrderToErpnextWorkflow } from "../workflows/sync-order-to-erpnext";

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");
  logger.info(
    `[PayloadSync] order.placed received for ${data.id}. Discovering inventory to sync...`,
  );

  try {
    // 1. Fetch the order and its items
    const query = container.resolve("query");
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["items.variant_id"],
      filters: { id: data.id },
    });

    const order = orders?.[0];
    if (!order || !order.items) return;

    // 2. Fetch inventory items linked to the ordered variants
    const variantIds = order.items
      .map((i: any) => i.variant_id)
      .filter(Boolean);
    if (variantIds.length === 0) return;

    const { data: variants } = await query.graph({
      entity: "variant",
      fields: ["inventory_items.inventory_item_id"],
      filters: { id: variantIds },
    });

    const inventoryItemIds = Array.from(
      new Set(
        variants.flatMap(
          (v: any) =>
            v.inventory_items?.map((ii: any) => ii.inventory_item_id) || [],
        ),
      ),
    );

    // 3. Trigger inventory sync workflow for each affected inventory item
    for (const inventoryItemId of inventoryItemIds) {
      await syncInventoryToPayloadWorkflow(container).run({
        input: { inventoryItemId },
      });
    }
  } catch (error: any) {
    logger.error(
      `[PayloadSync] Order workflow failed for order ${data.id}: ${error.message}`,
    );
  }

  try {
    logger.info(
      `[ERPNextSync] Triggering outbound sync for order ${data.id}...`,
    );
    await syncOrderToErpnextWorkflow(container).run({
      input: { orderId: data.id },
    });
  } catch (error: any) {
    logger.error(
      `[ERPNextSync] Order sync failed for order ${data.id}: ${error.message}`,
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
