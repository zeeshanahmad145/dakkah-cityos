import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateBookingSchema = z
  .object({
    status: z.string().optional(),
    starts_at: z.string().optional(),
    ends_at: z.string().optional(),
    timezone: z.string().optional(),
    customer_name: z.string().optional(),
    customer_email: z.string().optional(),
    customer_phone: z.string().optional(),
    notes: z.string().optional(),
    internal_notes: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any;
    const { id } = req.params;

    const {
      data: [booking],
    } = await query.graph({
      entity: "booking",
      fields: [
        "id",
        "customer_id",
        "provider_id",
        "service_product_id",
        "order_id",
        "status",
        "starts_at",
        "ends_at",
        "timezone",
        "customer_name",
        "customer_email",
        "customer_phone",
        "notes",
        "internal_notes",
        "cancelled_at",
        "cancellation_reason",
        "confirmed_at",
        "completed_at",
        "created_at",
        "updated_at",
        "provider.*",
        "service_product.*",
        "items.*",
        "reminders.*",
      ],
      filters: { id },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ booking });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin bookings id");
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bookingModuleService = req.scope.resolve("bookingModuleService") as unknown as any;
    const { id } = req.params;
    const parsed = updateBookingSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });

    const booking = await bookingModuleService.updateBookings({
      id,
      ...parsed.data,
    });

    res.json({ booking });
  } catch (error: unknown) {
    handleApiError(res, error, "PUT admin bookings id");
  }
}
