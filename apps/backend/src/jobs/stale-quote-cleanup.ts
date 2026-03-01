// @ts-nocheck
import { MedusaContainer } from "@medusajs/framework/types"
import { createLogger } from "../lib/logger"
const logger = createLogger("jobs:stale-quote-cleanup")

export default async function staleQuoteCleanupJob(container: MedusaContainer) {
  const query = container.resolve("query") as unknown as any
  const quoteService = container.resolve("quote") as unknown as any
  
  logger.info("[Quote Cleanup] Checking for stale quotes...")
  
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: staleQuotes } = await query.graph({
      entity: "quote",
      fields: ["id", "status", "created_at", "valid_until"],
      filters: {
        status: { $in: ["draft", "submitted", "under_review"] },
        created_at: { $lt: thirtyDaysAgo.toISOString() }
      }
    })
    
    if (!staleQuotes || staleQuotes.length === 0) {
      logger.info("[Quote Cleanup] No stale quotes found")
      return
    }
    
    let expiredCount = 0
    
    for (const quote of staleQuotes) {
      if (quote.valid_until && new Date(quote.valid_until) > new Date()) {
        continue
      }
      
      try {
        await quoteService.updateQuotes({
          id: quote.id,
          status: "expired",
          metadata: {
            auto_expired: true,
            expired_reason: "exceeded_30_day_limit",
            expired_at: new Date().toISOString()
          }
        })
        
        expiredCount++
      } catch (error) {
        logger.error(`[Quote Cleanup] Failed to expire quote ${quote.id}:`, error)
      }
    }
    
    logger.info(`[Quote Cleanup] Expired ${expiredCount} quotes`)
  } catch (error) {
    logger.error("[Quote Cleanup] Job failed:", error)
  }
}

export const config = {
  name: "stale-quote-cleanup",
  schedule: "0 3 * * *", // Daily at 3 AM
}
