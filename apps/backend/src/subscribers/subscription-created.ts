import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function subscriptionCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const subscriptionService = container.resolve("subscription") as unknown as any

  try {
    const subscription = await subscriptionService.retrieveSubscription(data.id)
    
    if (!subscription) {
      logger.warn("Subscription not found", { subscriptionId: data.id })
      return
    }

    const customerEmail = subscription.customer?.email || subscription.metadata?.email
    
    if (!customerEmail) {
      logger.warn("No customer email found", { subscriptionId: data.id })
      return
    }

    if (appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: customerEmail,
        channel: "email",
        template: "subscription-welcome",
        data: {
          subscription_id: subscription.id,
          plan_name: subscription.plan?.name || "Subscription Plan",
          price: subscription.plan?.price,
          billing_interval: subscription.billing_interval,
          next_billing_date: subscription.next_billing_date,
          customer_name: subscription.customer?.first_name || "Customer",
        },
      })
    }

    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "New Subscription",
          description: `New subscription to ${subscription.plan?.name || "plan"} created`,
        },
      })
    }

    logger.info("Subscription created notification sent", { 
      subscriptionId: data.id, 
      email: customerEmail 
    })
  } catch (error) {
    logger.error("Subscription created handler error", error, { subscriptionId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "subscription.created",
}
