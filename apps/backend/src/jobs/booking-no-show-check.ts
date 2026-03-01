// @ts-nocheck
import { MedusaContainer } from "@medusajs/framework/types"
import { createLogger } from "../lib/logger"
const logger = createLogger("jobs:booking-no-show-check")

export default async function bookingNoShowCheckJob(container: MedusaContainer) {
  const query = container.resolve("query") as unknown as any
  const bookingService = container.resolve("booking") as unknown as any
  const eventBus = container.resolve("event_bus") as unknown as any
  
  logger.info("[No-Show Check] Checking for no-shows...")
  
  try {
    // Check bookings that should have started 30+ minutes ago but weren't checked in
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    
    const { data: missedBookings } = await query.graph({
      entity: "booking",
      fields: ["*"],
      filters: {
        status: "confirmed",
        start_time: { $lt: thirtyMinutesAgo.toISOString() }
      }
    })
    
    if (!missedBookings || missedBookings.length === 0) {
      logger.info("[No-Show Check] No missed bookings found")
      return
    }
    
    let noShowCount = 0
    
    for (const booking of missedBookings) {
      try {
        await bookingService.updateBookings({
          id: booking.id,
          status: "no_show",
          metadata: {
            ...booking.metadata,
            no_show_detected_at: new Date().toISOString()
          }
        })
        
        await eventBus.emit("booking.no_show", {
          id: booking.id,
          customer_id: booking.customer_id,
          service_product_id: booking.service_product_id
        })
        
        noShowCount++
        logger.info(`[No-Show Check] Marked booking ${booking.id} as no-show`)
      } catch (error) {
        logger.error(`[No-Show Check] Failed to mark booking ${booking.id}:`, error)
      }
    }
    
    logger.info(`[No-Show Check] Marked ${noShowCount} bookings as no-show`)
  } catch (error) {
    logger.error("[No-Show Check] Job failed:", error)
  }
}

export const config = {
  name: "booking-no-show-check",
  schedule: "*/15 * * * *", // Every 15 minutes
}
