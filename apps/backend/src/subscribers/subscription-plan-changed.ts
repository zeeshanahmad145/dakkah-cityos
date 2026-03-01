// @ts-nocheck
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function subscriptionPlanChangedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; old_plan_id?: string; new_plan_id?: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const subscriptionService = container.resolve("subscription") as unknown as any
  
  try {
    const subscription = await subscriptionService.retrieveSubscription(data.id)
    const customerEmail = subscription?.customer?.email || subscription?.metadata?.email
    
    let oldPlanName = "Previous Plan"
    let newPlanName = subscription?.plan?.name || "New Plan"
    
    if (data.old_plan_id) {
      try {
        const oldPlan = await subscriptionService.retrieveSubscriptionPlan(data.old_plan_id)
        oldPlanName = oldPlan?.name || oldPlanName
      } catch {
        // Old plan may have been deleted
      }
    }
    
    if (customerEmail && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: customerEmail,
        channel: "email",
        template: "subscription-plan-changed",
        data: {
          subscription_id: subscription.id,
          old_plan_name: oldPlanName,
          new_plan_name: newPlanName,
          new_price: subscription.plan?.price,
          effective_date: subscription.current_period_end,
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
          title: "Subscription Plan Changed",
          description: `Subscription ${subscription?.id} changed from ${oldPlanName} to ${newPlanName}`,
        }
      })
    }
    
    logger.info("Subscription plan changed notification sent", { 
      subscriptionId: data.id,
      oldPlanId: data.old_plan_id,
      newPlanId: data.new_plan_id 
    })
  } catch (error) {
    logger.error("Subscription plan changed handler error", error, { subscriptionId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "subscription.plan_changed",
}
