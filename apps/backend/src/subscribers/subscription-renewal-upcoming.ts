import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function subscriptionRenewalUpcomingHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; days_until_renewal?: number }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const subscriptionService = container.resolve("subscription") as unknown as any
  
  try {
    const subscription = await subscriptionService.retrieveSubscription(data.id)
    const customerEmail = subscription?.customer?.email || subscription?.metadata?.email
    
    const daysUntilRenewal = data.days_until_renewal || 7
    
    if (customerEmail && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: customerEmail,
        channel: "email",
        template: "subscription-renewal-upcoming",
        data: {
          subscription_id: subscription.id,
          plan_name: subscription.plan?.name || "Subscription",
          renewal_date: subscription.next_billing_date,
          days_until_renewal: daysUntilRenewal,
          renewal_amount: subscription.plan?.price,
          manage_url: `${appConfig.urls.storefront}/account/subscriptions/${subscription.id}`,
          customer_name: subscription.customer?.first_name || "Customer",
        }
      })
    }
    
    logger.info("Subscription renewal reminder sent", { 
      subscriptionId: data.id,
      daysUntilRenewal 
    })
  } catch (error) {
    logger.error("Subscription renewal upcoming handler error", error, { subscriptionId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "subscription.renewal_upcoming",
}
