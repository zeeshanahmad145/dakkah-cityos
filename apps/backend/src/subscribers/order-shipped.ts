import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function orderShippedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; fulfillment_id?: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const query = container.resolve("query") as unknown as any

  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "items.*",
        "shipping_address.*",
        "customer.first_name",
        "fulfillments.*",
      ],
      filters: { id: data.id },
    })

    const order = orders[0]
    if (!order?.email) {
      logger.warn("Order not found or no email", { orderId: data.id })
      return
    }

    const fulfillment = order.fulfillments?.find((f: { id: string }) => f.id === data.fulfillment_id) || order.fulfillments?.[0]

    if (appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: order.email,
        channel: "email",
        template: "order-shipped",
        data: {
          order_id: order.id,
          display_id: order.display_id,
          customer_name: order.customer?.first_name || "Customer",
          tracking_number: fulfillment?.tracking_numbers?.[0] || "N/A",
          tracking_url: fulfillment?.tracking_links?.[0] || null,
          carrier: fulfillment?.provider_id || "Standard Shipping",
          items: order.items,
        },
      })
    }

    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "Order Shipped",
          description: `Order #${order.display_id} has been shipped`,
        },
      })
    }

    logger.info("Order shipped notification sent", { 
      orderId: order.id, 
      email: order.email 
    })
  } catch (error) {
    logger.error("Order shipped handler error", error, { orderId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
}
