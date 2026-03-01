// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const rescheduleSchema = z.object({
  new_scheduled_at: z.string(),
  new_provider_id: z.string().optional(),
  notify_customer: z.boolean().optional(),
  reason: z.string().optional(),
}).passthrough()

// POST - Admin reschedule booking
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const parsed = rescheduleSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }
  const { 
    new_scheduled_at, 
    new_provider_id,
    notify_customer,
    reason 
  } = parsed.data

  const query = req.scope.resolve("query") as unknown as any
  const bookingService = req.scope.resolve("booking") as unknown as any

  const { data: bookings } = await query.graph({
    entity: "booking",
    fields: ["id", "status", "scheduled_at", "provider_id", "customer_id", "service_id"],
    filters: { id }
  })

  if (!bookings.length) {
    return res.status(404).json({ message: "Booking not found" })
  }

  const booking = bookings[0]

  // Validate booking can be rescheduled
  if (["completed", "cancelled", "no_show"].includes(booking.status)) {
    return res.status(400).json({ 
      message: `Cannot reschedule a ${booking.status} booking` 
    })
  }

  // Validate new time is in the future
  const newTime = new Date(new_scheduled_at)
  if (newTime <= new Date()) {
    return res.status(400).json({ 
      message: "New scheduled time must be in the future" 
    })
  }

  // Check provider availability if changing provider or time
  const providerId = new_provider_id || booking.provider_id
  
  // TODO: Add availability check logic here
  // For now, just update the booking

  const previousScheduledAt = booking.scheduled_at

  // Update booking
  await bookingService.updateBookings({
    selector: { id },
    data: {
      scheduled_at: newTime,
      provider_id: providerId,
      rescheduled_at: new Date(),
      reschedule_reason: reason,
      reschedule_count: (booking.reschedule_count || 0) + 1
    }
  })

  // Log the reschedule
  // TODO: Add booking history/audit log entry

  // Send notification if requested
  if (notify_customer) {
    // TODO: Send notification to customer about reschedule
  }

  res.json({
    message: "Booking rescheduled successfully",
    booking_id: id,
    previous_time: previousScheduledAt,
    new_time: newTime,
    provider_id: providerId
  })
}

