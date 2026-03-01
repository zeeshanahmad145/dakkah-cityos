import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * GET /store/bookings/availability
 * Get available time slots for a service
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bookingModule = req.scope.resolve("booking") as unknown as any;

  const { service_id, date, provider_id } = req.query;

  if (!service_id || !date) {
    return res.status(400).json({
      message: "service_id and date are required",
    });
  }

  try {
    // Parse the date
    const targetDate = new Date(date as string);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Get available slots
    const slots = await bookingModule.getAvailableSlots(
      service_id as string,
      targetDate,
      provider_id as string | undefined,
    );

    // Get service details for context
    const service = await bookingModule.retrieveServiceProduct(
      service_id as string,
    );

    // Format slots for response
    const formattedSlots = slots.map((slot: any) => ({
      start_time: slot.start.toISOString(),
      end_time: slot.end.toISOString(),
      provider_id: slot.providerId,
      duration_minutes: service.duration_minutes,
    }));

    res.json({
      service_id,
      date: date as string,
      service: {
        id: service.id,
        name: service.name,
        duration_minutes: service.duration_minutes,
        price: service.base_price,
      },
      available_slots: formattedSlots,
      count: formattedSlots.length,
    });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-BOOKINGS-AVAILABILITY");
  }
}
