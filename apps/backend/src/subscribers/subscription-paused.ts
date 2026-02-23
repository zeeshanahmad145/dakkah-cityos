import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function subscriptionPausedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; reason?: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const subscriptionService = container.resolve("subscription")
  
  try {
    const subscription = await subscriptionService.retrieveSubscription(data.id)
    const customerEmail = subscription?.customer?.email || subscription?.metadata?.email
    
    if (customerEmail && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: customerEmail,
        channel: "email",
        template: "subscription-paused",
        data: {
          subscription_id: subscription.id,
          plan_name: subscription.plan?.name || "Subscription",
          pause_reason: data.reason || "Paused by request",
          resume_url: `${appConfig.urls.storefront}/account/subscriptions/${subscription.id}`,
          customer_name: subscription.customer?.first_name || "Customer",
        }
      })
    }
    
    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "Subscription Paused",
          description: `Subscription ${subscription?.id} paused: ${data.reason || "Customer request"}`,
        }
      })
    }
    
    logger.info("Subscription paused notification sent", { 
      subscriptionId: data.id, 
      reason: data.reason 
    })
  } catch (error) {
    logger.error("Subscription paused handler error", error, { subscriptionId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "subscription.paused",
}
