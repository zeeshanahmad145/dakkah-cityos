// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

// No body fields required - action triggered by URL path parameter [id]
// Handler does not extract or use any fields from the request body
const confirmBookingSchema = z.object({
}).strict()

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const customerId = req.auth_context?.actor_id
  
  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  
  const bookingService = req.scope.resolve("booking") as unknown as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any
  
  const parsed = confirmBookingSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  try {
    const { data: bookings } = await query.graph({
      entity: "booking",
      fields: ["*", "service.*"],
      filters: { id, customer_id: customerId }
    })
    
    const booking = bookings?.[0]
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }
    
    if (booking.status !== "pending") {
      return res.status(400).json({ 
        message: `Booking cannot be confirmed. Current status: ${booking.status}` 
      })
    }
    
    const updated = await bookingService.updateBookings({
      id,
      status: "confirmed",
      confirmed_at: new Date(),
      metadata: {
        ...booking.metadata,
        confirmed_by: customerId,
      }
    })
    
    const eventBus = req.scope.resolve("event_bus") as unknown as any
    await eventBus.emit("booking.confirmed", { 
      id, 
      customer_id: customerId,
      service_id: booking.service_id 
    })
    
    res.json({ booking: updated })
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-BOOKINGS-ID-CONFIRM")}
}

