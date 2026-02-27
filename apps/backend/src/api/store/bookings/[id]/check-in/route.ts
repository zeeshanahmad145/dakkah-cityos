// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const checkInSchema = z.object({
  check_in_code: z.string().optional(),
})

// POST - Customer self-check-in for booking
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const customerId = (req as any).auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const parsed = checkInSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  const { id } = req.params
  const { check_in_code } = parsed.data
  const query = req.scope.resolve("query")
  const bookingService = req.scope.resolve("booking")

  const { data: bookings } = await query.graph({
    entity: "booking",
    fields: ["id", "status", "check_in_code", "scheduled_at", "customer_id"],
    filters: { id }
  })

  if (!bookings.length) {
    return res.status(404).json({ message: "Booking not found" })
  }

  const booking = bookings[0]

  // Validate booking can be checked in
  if (booking.status !== "confirmed") {
    return res.status(400).json({ 
      message: "Only confirmed bookings can be checked in" 
    })
  }

  // Validate check-in window (allow 30 min before to 15 min after)
  const now = new Date()
  const scheduledAt = new Date(booking.scheduled_at)
  const windowStart = new Date(scheduledAt.getTime() - 30 * 60 * 1000)
  const windowEnd = new Date(scheduledAt.getTime() + 15 * 60 * 1000)

  if (now < windowStart) {
    return res.status(400).json({ 
      message: "Check-in is not yet available. Please try again closer to your appointment time." 
    })
  }

  if (now > windowEnd) {
    return res.status(400).json({ 
      message: "Check-in window has passed. Please contact support." 
    })
  }

  // Validate check-in code if required
  if (booking.check_in_code && check_in_code !== booking.check_in_code) {
    return res.status(400).json({ 
      message: "Invalid check-in code" 
    })
  }

  // Update booking status
  await bookingService.updateBookings({
    selector: { id },
    data: {
      status: "checked_in",
      checked_in_at: new Date()
    }
  })

  res.json({
    message: "Successfully checked in",
    booking_id: id,
    checked_in_at: new Date()
  })
}

// GET - Get check-in status and QR code data
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const query = req.scope.resolve("query")

  const { data: bookings } = await query.graph({
    entity: "booking",
    fields: ["id", "status", "check_in_code", "scheduled_at", "checked_in_at"],
    filters: { id }
  })

  if (!bookings.length) {
    return res.status(404).json({ message: "Booking not found" })
  }

  const booking = bookings[0]
  const now = new Date()
  const scheduledAt = new Date(booking.scheduled_at)
  const windowStart = new Date(scheduledAt.getTime() - 30 * 60 * 1000)
  const windowEnd = new Date(scheduledAt.getTime() + 15 * 60 * 1000)

  res.json({
    booking_id: booking.id,
    status: booking.status,
    can_check_in: booking.status === "confirmed" && now >= windowStart && now <= windowEnd,
    check_in_window: {
      start: windowStart,
      end: windowEnd
    },
    checked_in_at: booking.checked_in_at,
    qr_code_data: `booking:${booking.id}:${booking.check_in_code || ""}` 
  })
}

