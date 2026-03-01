import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { syncCategoryToPayloadWorkflow } from "../workflows/sync-category-to-payload";

export default async function categoryUpdateHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger") as unknown as any;
  logger.info(
    `[PayloadSync] product-category event received for ${data.id}. Syncing hierarchy to CMS...`,
  );

  try {
    await syncCategoryToPayloadWorkflow(container).run({
      input: {
        categoryId: data.id,
      },
    });
  } catch (error: unknown) {
    logger.error(
      `[PayloadSync] Category hierarchy workflow failed for ${data.id}: ${(error instanceof Error ? error.message : String(error))}`,
    );
  }
}

export const config: SubscriberConfig = {
  event: ["product-category.created", "product-category.updated"],
};
