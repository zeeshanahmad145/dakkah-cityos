import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function orderReturnedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; return_id?: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const query = container.resolve("query") as unknown as any
  
  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["*", "customer.*"],
      filters: { id: data.id }
    })
    
    const order = orders?.[0]
    const customer = order?.customer
    
    if (customer?.email && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: customer.email,
        channel: "email",
        template: "order-returned",
        data: {
          order_id: order.id,
          order_display_id: order.display_id,
          return_id: data.return_id,
          customer_name: customer.first_name || "Customer",
          refund_timeline: "5-10 business days after we receive your return",
        }
      })
    }
    
    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "Order Return Processed",
          description: `Return processed for order #${order?.display_id}`,
        }
      })
    }
    
    logger.info("Order returned notification sent", { 
      orderId: data.id, 
      returnId: data.return_id 
    })
  } catch (error) {
    logger.error("Order returned handler error", error, { orderId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "order.return.received",
}
