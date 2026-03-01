// @ts-nocheck
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function paymentAuthorizedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const query = container.resolve("query") as unknown as any
  
  try {
    const { data: payments } = await query.graph({
      entity: "payment",
      fields: ["*", "payment_collection.order.*"],
      filters: { id: data.id }
    })
    
    const payment = payments?.[0]
    const order = payment?.payment_collection?.order
    
    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "Payment Authorized",
          description: `Payment of ${payment?.amount} ${payment?.currency_code} authorized for order #${order?.display_id}`,
        }
      })
    }
    
    logger.info("Payment authorized", { 
      paymentId: data.id, 
      orderId: order?.id 
    })
  } catch (error) {
    logger.error("Payment authorized handler error", error, { paymentId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "payment.authorized",
}
