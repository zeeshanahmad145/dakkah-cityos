// @ts-nocheck
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function paymentFailedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; error?: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const query = container.resolve("query") as unknown as any
  
  try {
    const { data: payments } = await query.graph({
      entity: "payment",
      fields: ["*", "payment_collection.order.*", "payment_collection.order.customer.*"],
      filters: { id: data.id }
    })
    
    const payment = payments?.[0]
    const order = payment?.payment_collection?.order
    const customer = order?.customer
    
    if (customer?.email && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: customer.email,
        channel: "email",
        template: "payment-failed",
        data: {
          order_id: order?.id,
          order_display_id: order?.display_id,
          error: data.error || "Payment could not be processed",
          retry_url: `${appConfig.urls.storefront}/checkout?retry=true`,
          customer_name: customer.first_name || "Customer",
        }
      })
    }
    
    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "Payment Failed",
          description: `Payment failed for order #${order?.display_id}: ${data.error || "Unknown error"}`,
        }
      })
    }
    
    logger.info("Payment failed notification sent", { 
      paymentId: data.id, 
      orderId: order?.id,
      error: data.error 
    })
  } catch (error) {
    logger.error("Payment failed handler error", error, { paymentId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "payment.payment_capture_failed",
}
