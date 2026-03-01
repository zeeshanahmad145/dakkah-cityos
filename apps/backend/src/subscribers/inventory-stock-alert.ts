import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { subscriberLogger } from "../lib/logger";
import InventoryExtensionModuleService from "../modules/inventory-extension/service";

const logger = subscriberLogger;

export default async function inventoryStockAlertHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const inventoryExtension = container.resolve("inventoryExtension") as unknown as any;
    const query = container.resolve("query") as unknown as any;

    const { data: items } = await query.graph({
      entity: "inventory_item",
      fields: ["id", "sku", "title"],
      filters: { id: data.id },
    });

    const item = items?.[0];
    if (!item) return;

    const alerts = await inventoryExtension.listStockAlerts({
      inventory_item_id: data.id,
      is_active: true,
    });

    if (alerts.length > 0) {
      logger.info("Stock alert triggered for inventory item", {
        inventoryItemId: data.id,
        sku: item.sku,
        activeAlerts: alerts.length,
      });
    }
  } catch (error) {
    logger.error("Inventory stock alert handler error", error, {
      itemId: data.id,
    });
  }
}

export const config: SubscriberConfig = {
  event: "inventory-item.updated",
};
