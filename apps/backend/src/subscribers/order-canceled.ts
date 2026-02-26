import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { syncInventoryToPayloadWorkflow } from "../workflows/sync-inventory-to-payload";

export default async function orderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");
  logger.info(
    `[PayloadSync] order.canceled received for ${data.id}. Restoring Payload availability...`,
  );

  try {
    const query = container.resolve("query");
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["items.variant_id"],
      filters: { id: data.id },
    });

    const order = orders?.[0];
    if (!order || !order.items) return;

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

    for (const inventoryItemId of inventoryItemIds) {
      await syncInventoryToPayloadWorkflow(container).run({
        input: { inventoryItemId },
      });
    }
  } catch (error: any) {
    logger.error(
      `[PayloadSync] Order cancel workflow failed for order ${data.id}: ${error.message}`,
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.canceled",
};
