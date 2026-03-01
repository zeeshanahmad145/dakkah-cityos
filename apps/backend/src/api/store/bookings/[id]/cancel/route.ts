import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../../lib/api-error-handler";

const cancelBookingSchema = z.object({
  reason: z.string().optional(),
});

/**
 * POST /store/bookings/:id/cancel
 * Cancel a booking
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const bookingModule = req.scope.resolve("booking") as unknown as any;
  const { id } = req.params;

  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const customerId = req.auth_context.actor_id;

  const parsed = cancelBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  }

  const { reason } = parsed.data;

  try {
    const booking = await bookingModule.retrieveBooking(id);

    // Verify ownership
    if (booking.customer_id !== customerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Cancel the booking
    const cancelledBooking = await bookingModule.cancelBooking(
      id,
      "customer",
      reason,
    );

    res.json({
      booking: cancelledBooking,
      message: "Booking cancelled successfully",
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-BOOKINGS-ID-CANCEL");
  }
}
