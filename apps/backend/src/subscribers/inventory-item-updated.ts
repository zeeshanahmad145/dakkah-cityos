import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { syncInventoryToPayloadWorkflow } from "../workflows/sync-inventory-to-payload";

export default async function inventoryItemUpdateHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger") as unknown as any;
  logger.info(
    `[PayloadSync] inventory-item.updated received for ${data.id}. Syncing availability...`,
  );

  try {
    await syncInventoryToPayloadWorkflow(container).run({
      input: {
        inventoryItemId: data.id,
      },
    });
  } catch (error: unknown) {
    logger.error(
      `[PayloadSync] Inventory workflow failed for item ${data.id}: ${(error instanceof Error ? error.message : String(error))}`,
    );
  }
}

export const config: SubscriberConfig = {
  event: "inventory-item.updated",
};
