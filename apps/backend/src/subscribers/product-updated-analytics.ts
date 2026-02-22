import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { subscriberLogger } from "../lib/logger";
import AnalyticsModuleService from "../modules/analytics/service";

const logger = subscriberLogger;

export default async function productUpdatedAnalyticsHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const analytics = container.resolve("analytics") as any;

    await analytics.createAnalyticsEvents({
      event_type: "product.updated",
      entity_id: data.id,
      entity_type: "product",
      tenant_id: "default",
      properties: { product_id: data.id },
    });

    logger.info("Analytics event tracked for product update", {
      productId: data.id,
    });
  } catch (error) {
    logger.error("Product analytics handler error", error, {
      productId: data.id,
    });
  }
}

export const config: SubscriberConfig = {
  event: "product.updated",
};
