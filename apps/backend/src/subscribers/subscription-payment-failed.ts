import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function subscriptionPaymentFailedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; error?: string; retry_count?: number }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const subscriptionService = container.resolve("subscription")
  
  try {
    const subscription = await subscriptionService.retrieveSubscription(data.id)
    const customerEmail = subscription?.customer?.email || subscription?.metadata?.email
    
    const retryCount = data.retry_count || 1
    const maxRetries = appConfig.subscription.maxPaymentRetries
    const willRetry = retryCount < maxRetries
    
    if (customerEmail && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: customerEmail,
        channel: "email",
        template: "subscription-payment-failed",
        data: {
          subscription_id: subscription.id,
          plan_name: subscription.plan?.name || "Subscription",
          error: data.error || "Payment could not be processed",
          retry_count: retryCount,
          max_retries: maxRetries,
          will_retry: willRetry,
          update_payment_url: `${appConfig.urls.storefront}/account/subscriptions/${subscription.id}/payment`,
          customer_name: subscription.customer?.first_name || "Customer",
          grace_period_days: appConfig.subscription.gracePeriodDays,
        }
      })
    }
    
    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "Subscription Payment Failed",
          description: `Payment failed for subscription ${subscription?.id} (attempt ${retryCount}/${maxRetries})`,
        }
      })
    }
    
    logger.info("Subscription payment failed notification sent", { 
      subscriptionId: data.id,
      retryCount,
      willRetry,
      error: data.error 
    })
  } catch (error) {
    logger.error("Subscription payment failed handler error", error, { subscriptionId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "subscription.payment_failed",
}
