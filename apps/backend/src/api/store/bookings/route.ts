import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createBookingSchema = z.object({
  service_id: z.string().min(1),
  provider_id: z.string().optional(),
  start_time: z.string().min(1),
  attendee_count: z.number().optional(),
  customer_name: z.string().optional(),
  customer_email: z.string().min(1),
  customer_phone: z.string().optional(),
  customer_notes: z.string().optional(),
});

/**
 * GET /store/bookings
 * List customer's bookings
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bookingModule = req.scope.resolve("booking") as unknown as any;

  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const customerId = req.auth_context.actor_id;
  const { offset = 0, limit = 20, status } = req.query;

  try {
    const filters: Record<string, unknown> = { customer_id: customerId };
    if (status) filters.status = status;

    const bookings = await bookingModule.listBookings(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { start_time: "DESC" },
    });

    const bookingList = Array.isArray(bookings)
      ? bookings
      : [bookings].filter(Boolean);

    // Enrich with service details
    const enrichedBookings = await Promise.all(
      bookingList.map(async (booking: any) => {
        try {
          const service = await bookingModule.retrieveServiceProduct(
            booking.service_product_id,
          );
          return { ...booking, service };
        } catch {
          return booking;
        }
      }),
    );

    res.json({
      bookings: enrichedBookings,
      count: bookingList.length,
      offset: Number(offset),
      limit: Number(limit),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-BOOKINGS");
  }
}

/**
 * POST /store/bookings
 * Create a new booking
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const bookingModule = req.scope.resolve("booking") as unknown as any;

  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const customerId = req.auth_context.actor_id;

  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  }

  const {
    service_id,
    provider_id,
    start_time,
    attendee_count,
    customer_name,
    customer_email,
    customer_phone,
    customer_notes,
  } = parsed.data;

  try {
    const booking = await bookingModule.createBooking({
      serviceProductId: service_id,
      customerId,
      customerName: customer_name || "Customer",
      customerEmail: customer_email,
      customerPhone: customer_phone,
      providerId: provider_id,
      startTime: new Date(start_time),
      attendeeCount: attendee_count || 1,
      customerNotes: customer_notes,
    });

    // Fetch service details
    const service = await bookingModule.retrieveServiceProduct(
      booking.service_product_id,
    );

    res.status(201).json({
      booking: { ...booking, service },
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-BOOKINGS");
  }
}
