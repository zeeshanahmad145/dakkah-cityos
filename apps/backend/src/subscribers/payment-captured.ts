// @ts-nocheck
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function paymentCapturedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
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
        template: "payment-confirmed",
        data: {
          order_id: order.id,
          order_display_id: order.display_id,
          amount: payment.amount,
          currency: payment.currency_code,
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
          title: "Payment Captured",
          description: `Payment of ${payment.amount} ${payment.currency_code} captured for order #${order?.display_id}`,
        }
      })
    }
    
    logger.info("Payment captured", { 
      paymentId: data.id, 
      orderId: order?.id,
      amount: payment?.amount 
    })
  } catch (error) {
    logger.error("Payment captured handler error", error, { paymentId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "payment.captured",
}
