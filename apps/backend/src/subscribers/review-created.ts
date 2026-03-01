import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function reviewCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; product_id?: string; rating?: number }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const query = container.resolve("query") as unknown as any
  
  try {
    let productName = "Product"
    
    if (data.product_id) {
      const { data: products } = await query.graph({
        entity: "product",
        fields: ["title"],
        filters: { id: data.product_id }
      })
      productName = products?.[0]?.title || productName
    }
    
    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "New Review",
          description: `New ${data.rating || 5}-star review for "${productName}"`,
        }
      })
    }
    
    logger.info("Review created notification sent", { 
      reviewId: data.id, 
      productId: data.product_id,
      rating: data.rating 
    })
  } catch (error) {
    logger.error("Review created handler error", error, { reviewId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "review.created",
}
