import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function orderCancelledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; reason?: string }>) {
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
        template: "order-cancelled",
        data: {
          order_id: order.id,
          order_display_id: order.display_id,
          reason: data.reason || "Order cancelled per your request",
          customer_name: customer.first_name || "Customer",
          refund_info: "Your refund will be processed within 5-10 business days",
        }
      })
    }
    
    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "Order Cancelled",
          description: `Order #${order?.display_id} has been cancelled: ${data.reason || "No reason provided"}`,
        }
      })
    }
    
    logger.info("Order cancelled notification sent", { 
      orderId: data.id, 
      reason: data.reason 
    })
  } catch (error) {
    logger.error("Order cancelled handler error", error, { orderId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
