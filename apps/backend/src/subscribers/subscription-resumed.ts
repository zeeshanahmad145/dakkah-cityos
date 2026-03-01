import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function subscriptionResumedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const subscriptionService = container.resolve("subscription") as unknown as any
  
  try {
    const subscription = await subscriptionService.retrieveSubscription(data.id)
    const customerEmail = subscription?.customer?.email || subscription?.metadata?.email
    
    if (customerEmail && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: customerEmail,
        channel: "email",
        template: "subscription-resumed",
        data: {
          subscription_id: subscription.id,
          plan_name: subscription.plan?.name || "Subscription",
          next_billing_date: subscription.next_billing_date,
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
          title: "Subscription Resumed",
          description: `Subscription ${subscription?.id} has been resumed`,
        }
      })
    }
    
    logger.info("Subscription resumed notification sent", { subscriptionId: data.id })
  } catch (error) {
    logger.error("Subscription resumed handler error", error, { subscriptionId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "subscription.resumed",
}
