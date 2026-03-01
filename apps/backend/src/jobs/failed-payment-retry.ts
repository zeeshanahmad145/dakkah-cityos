// @ts-nocheck
import { MedusaContainer } from "@medusajs/framework/types"
import { createLogger } from "../lib/logger"
const logger = createLogger("jobs:failed-payment-retry")

export default async function failedPaymentRetryJob(container: MedusaContainer) {
  const query = container.resolve("query") as unknown as any
  const subscriptionService = container.resolve("subscription") as unknown as any
  const eventBus = container.resolve("event_bus") as unknown as any
  
  logger.info("[Payment Retry] Starting retry job...")
  
  try {
    const { data: failedSubscriptions } = await query.graph({
      entity: "subscription",
      fields: ["*"],
      filters: {
        status: "past_due"
      }
    })
    
    if (!failedSubscriptions || failedSubscriptions.length === 0) {
      logger.info("[Payment Retry] No failed payments to retry")
      return
    }
    
    let successCount = 0
    let failCount = 0
    let cancelledCount = 0
    
    for (const subscription of failedSubscriptions) {
      const retryCount = subscription.retry_count || 0
      
      if (retryCount >= subscription.max_retry_attempts) {
        await subscriptionService.updateSubscriptions({
          id: subscription.id,
          status: "canceled",
          canceled_at: new Date(),
          metadata: {
            ...subscription.metadata,
            cancellation_reason: "payment_failed_max_retries"
          }
        })
        
        await eventBus.emit("subscription.cancelled", {
          id: subscription.id,
          reason: "payment_failed_max_retries"
        })
        
        cancelledCount++
        logger.info(`[Payment Retry] Cancelled subscription ${subscription.id} - max retries exceeded`)
        continue
      }
      
      try {
        const { dispatchEventToTemporal } = await import("../lib/event-dispatcher.js")
        const result = await dispatchEventToTemporal("subscription.payment_failed", {
          subscription_id: subscription.id,
          customer_id: subscription.customer_id,
          amount: subscription.total,
          currency: subscription.currency_code || "usd",
          payment_method_id: subscription.payment_method_id,
          stripe_customer_id: subscription.metadata?.stripe_customer_id,
          retry_attempt: retryCount + 1,
          action: "retry_payment",
        }, {
          tenantId: subscription.metadata?.tenant_id,
          source: "failed-payment-retry-job",
        })

        if (result.dispatched) {
          await subscriptionService.updateSubscriptions({
            id: subscription.id,
            retry_count: retryCount + 1,
            last_retry_at: new Date(),
            metadata: {
              ...subscription.metadata,
              last_retry_workflow_run_id: result.runId,
            }
          })
          successCount++
          logger.info(`[Payment Retry] Dispatched to Temporal for subscription ${subscription.id}, runId: ${result.runId}`)
          continue
        }

        throw new Error("Failed to dispatch payment retry to Temporal")
      } catch (error: unknown) {
        await subscriptionService.updateSubscriptions({
          id: subscription.id,
          retry_count: retryCount + 1,
          last_retry_at: new Date(),
          metadata: {
            ...subscription.metadata,
            last_retry_error: (error instanceof Error ? error.message : String(error))
          }
        })
        
        await eventBus.emit("subscription.payment_failed", {
          id: subscription.id,
          customer_id: subscription.customer_id,
          error: (error instanceof Error ? error.message : String(error)),
          retry_count: retryCount + 1
        })
        
        failCount++
        logger.info(`[Payment Retry] Failed for subscription ${subscription.id}: ${(error instanceof Error ? error.message : String(error))}`)
      }
    }
    
    logger.info(`[Payment Retry] Completed - Success: ${successCount}, Failed: ${failCount}, Cancelled: ${cancelledCount}`)
  } catch (error) {
    logger.error("[Payment Retry] Job failed:", error)
  }
}

export const config = {
  name: "failed-payment-retry",
  schedule: "0 */6 * * *", // Every 6 hours
}
