import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { syncProductToPayloadWorkflow } from "../workflows/sync-product-to-payload";

export default async function productUpdateHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");
  logger.info(
    `[PayloadSync] product.updated event received for ${data.id}. Triggering workflow...`,
  );

  try {
    await syncProductToPayloadWorkflow(container).run({
      input: {
        productId: data.id,
      },
    });
  } catch (error: any) {
    logger.error(
      `[PayloadSync] Workflow failed for product ${data.id}: ${error.message}`,
    );
  }
}

export const config: SubscriberConfig = {
  event: "product.updated",
};
