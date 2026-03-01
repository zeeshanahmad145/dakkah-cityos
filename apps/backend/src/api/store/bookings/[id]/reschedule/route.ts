import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../../lib/api-error-handler";

const rescheduleBookingSchema = z.object({
  new_start_time: z.string().min(1),
  new_provider_id: z.string().optional(),
});

/**
 * POST /store/bookings/:id/reschedule
 * Reschedule a booking
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const bookingModule = req.scope.resolve("booking") as unknown as any;
  const { id } = req.params;

  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const customerId = req.auth_context.actor_id;

  const parsed = rescheduleBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  }

  const { new_start_time, new_provider_id } = parsed.data;

  try {
    const booking = await bookingModule.retrieveBooking(id);

    // Verify ownership
    if (booking.customer_id !== customerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Reschedule the booking
    const newBooking = await bookingModule.rescheduleBooking(
      id,
      new Date(new_start_time),
      new_provider_id,
    );

    // Enrich with service details
    const service = await bookingModule.retrieveServiceProduct(
      newBooking.service_product_id,
    );

    res.json({
      booking: { ...newBooking, service },
      message: "Booking rescheduled successfully",
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-BOOKINGS-ID-RESCHEDULE");
  }
}
