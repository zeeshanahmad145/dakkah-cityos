import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { syncProductToPayloadWorkflow } from "../workflows/sync-product-to-payload";

export default async function productUpdateHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger") as unknown as any;
  logger.info(
    `[PayloadSync] product.updated event received for ${data.id}. Triggering workflow...`,
  );

  try {
    await syncProductToPayloadWorkflow(container).run({
      input: {
        productId: data.id,
      },
    });
  } catch (error: unknown) {
    logger.error(
      `[PayloadSync] Workflow failed for product ${data.id}: ${(error instanceof Error ? error.message : String(error))}`,
    );
  }
}

export const config: SubscriberConfig = {
  event: "product.updated",
};
