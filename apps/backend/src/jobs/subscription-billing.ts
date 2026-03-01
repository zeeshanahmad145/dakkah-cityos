// @ts-nocheck
import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function subscriptionBillingJob(container: MedusaContainer) {
  const subscriptionService = container.resolve("subscription") as unknown as any
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const logger = container.resolve("logger") as unknown as any

  logger.info("[subscription-billing] Starting subscription billing job")

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const subscriptions = await subscriptionService.listSubscriptions({
      status: "active",
      current_period_end: { $lte: today.toISOString() },
    })

    logger.info(`[subscription-billing] Found ${subscriptions.length} subscriptions due for billing`)

    let successCount = 0
    let failedCount = 0

    for (const subscription of subscriptions) {
      try {
        const nextPeriodEnd = new Date(subscription.current_period_end)
        
        switch (subscription.billing_interval) {
          case "monthly":
            nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1)
            break
          case "quarterly":
            nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 3)
            break
          case "yearly":
            nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1)
            break
          case "weekly":
            nextPeriodEnd.setDate(nextPeriodEnd.getDate() + 7)
            break
          case "daily":
            nextPeriodEnd.setDate(nextPeriodEnd.getDate() + 1)
            break
          default:
            nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1)
        }

        await subscriptionService.updateSubscriptions(
          { id: subscription.id },
          { 
            current_period_end: nextPeriodEnd,
            current_period_start: today,
          }
        )

        if (subscription.metadata?.customer_email) {
          await notificationService.createNotifications({
            to: subscription.metadata.customer_email,
            channel: "email",
            template: "subscription-renewed",
            data: {
              subscription_id: subscription.id,
              next_billing_date: nextPeriodEnd,
            },
          })
        }

        successCount++
        logger.info(`[subscription-billing] Processed subscription ${subscription.id}`)
      } catch (error: unknown) {
        failedCount++
        logger.error(`[subscription-billing] Failed to process subscription ${subscription.id}:`, error)

        if (subscription.metadata?.customer_email) {
          try {
            await notificationService.createNotifications({
              to: subscription.metadata.customer_email,
              channel: "email",
              template: "subscription-payment-failed",
              data: {
                subscription_id: subscription.id,
              },
            })
          } catch (notifError) {
            logger.error(`[subscription-billing] Failed to send failure notification:`, notifError)
          }
        }
      }
    }

    logger.info(`[subscription-billing] Completed: ${successCount} successful, ${failedCount} failed`)
  } catch (error) {
    logger.error("[subscription-billing] Job failed:", error)
  }
}

export const config = {
  name: "subscription-billing",
  schedule: "0 0 * * *", // Daily at midnight
}
