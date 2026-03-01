// @ts-nocheck
import { MedusaContainer } from "@medusajs/framework/types"
import { createLogger } from "../lib/logger"
const logger = createLogger("jobs:trial-expiration")

export default async function trialExpirationJob(container: MedusaContainer) {
  const query = container.resolve("query") as unknown as any
  const subscriptionService = container.resolve("subscription") as unknown as any
  const eventBus = container.resolve("event_bus") as unknown as any
  
  logger.info("[Trial Expiration] Checking for expiring trials...")
  
  try {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    const { data: expiringTrials } = await query.graph({
      entity: "subscription",
      fields: ["*"],
      filters: {
        status: "active",
        trial_end: {
          $gte: now.toISOString(),
          $lt: tomorrow.toISOString()
        }
      }
    })
    
    logger.info(`[Trial Expiration] Found ${expiringTrials?.length || 0} trials expiring soon`)
    
    for (const subscription of expiringTrials || []) {
      await eventBus.emit("subscription.trial_ending", {
        id: subscription.id,
        customer_id: subscription.customer_id,
        trial_end: subscription.trial_end,
        has_payment_method: !!subscription.payment_method_id
      })
    }
    
    const { data: expiredTrials } = await query.graph({
      entity: "subscription",
      fields: ["*"],
      filters: {
        status: "active",
        trial_end: { $lt: now.toISOString() }
      }
    })
    
    logger.info(`[Trial Expiration] Found ${expiredTrials?.length || 0} expired trials`)
    
    let convertedCount = 0
    let expiredCount = 0
    
    for (const subscription of expiredTrials || []) {
      if (subscription.payment_method_id) {
        await subscriptionService.updateSubscriptions({
          id: subscription.id,
          status: "active",
          trial_end: null,
          current_period_start: new Date(),
          current_period_end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        })
        
        await eventBus.emit("subscription.trial_converted", {
          id: subscription.id,
          customer_id: subscription.customer_id
        })
        
        convertedCount++
        logger.info(`[Trial Expiration] Converted trial to active: ${subscription.id}`)
      } else {
        await subscriptionService.updateSubscriptions({
          id: subscription.id,
          status: "expired",
          metadata: {
            ...subscription.metadata,
            expiration_reason: "trial_ended_no_payment_method",
            expired_at: new Date().toISOString()
          }
        })
        
        await eventBus.emit("subscription.trial_expired", {
          id: subscription.id,
          customer_id: subscription.customer_id
        })
        
        expiredCount++
        logger.info(`[Trial Expiration] Expired trial (no payment): ${subscription.id}`)
      }
    }
    
    logger.info(`[Trial Expiration] Completed - Reminders: ${expiringTrials?.length || 0}, Converted: ${convertedCount}, Expired: ${expiredCount}`)
  } catch (error) {
    logger.error("[Trial Expiration] Job failed:", error)
  }
}

export const config = {
  name: "trial-expiration",
  schedule: "0 8 * * *", // Daily at 8 AM
}
