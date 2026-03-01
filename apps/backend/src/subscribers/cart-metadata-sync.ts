import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { subscriberLogger } from "../lib/logger";
import CartExtensionModuleService from "../modules/cart-extension/service";

const logger = subscriberLogger;

export default async function cartMetadataSyncHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const cartExtension = container.resolve("cartExtension") as unknown as any;

    const existing = await cartExtension.listCartMetadatas({
      cart_id: data.id,
    });

    if (existing.length === 0) {
      logger.info("No cart metadata to sync for cart", { cartId: data.id });
      return;
    }

    logger.info("Cart metadata sync triggered", {
      cartId: data.id,
      metadataCount: existing.length,
    });
  } catch (error) {
    logger.error("Cart metadata sync error", error, { cartId: data.id });
  }
}

export const config: SubscriberConfig = {
  event: "cart.updated",
};
