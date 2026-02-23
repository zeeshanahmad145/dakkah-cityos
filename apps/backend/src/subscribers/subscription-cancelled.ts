import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function subscriptionCancelledHandler({
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
        template: "subscription-cancelled",
        data: {
          subscription_id: subscription.id,
          plan_name: subscription.plan?.name || "Subscription",
          cancel_reason: data.reason || "Cancelled by request",
          end_date: subscription.current_period_end,
          customer_name: subscription.customer?.first_name || "Customer",
          resubscribe_url: `${appConfig.urls.storefront}/subscriptions`,
        },
      })
    }

    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "Subscription Cancelled",
          description: `Subscription cancelled: ${subscription.plan?.name || "Plan"}`,
        },
      })
    }

    logger.info("Subscription cancelled notification sent", { 
      subscriptionId: data.id, 
      reason: data.reason 
    })
  } catch (error) {
    logger.error("Subscription cancelled handler error", error, { subscriptionId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "subscription.cancelled",
}
