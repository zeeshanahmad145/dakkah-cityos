import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { handleApiError } from "../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorId = req.vendor_id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any;
    const {
      limit = "20",
      offset = "0",
      status,
      from,
      to,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = { provider_id: vendorId };
    if (status) filters.status = status;
    if (from) filters.start_time = { $gte: from };
    if (to) filters.end_time = { $lte: to };

    const { data: bookings } = await query.graph({
      entity: "booking",
      fields: [
        "id",
        "booking_number",
        "customer_id",
        "customer_name",
        "customer_email",
        "customer_phone",
        "service_product_id",
        "provider_id",
        "order_id",
        "start_time",
        "end_time",
        "timezone",
        "status",
        "attendee_count",
        "location_type",
        "currency_code",
        "subtotal",
        "tax_total",
        "total",
        "payment_status",
        "customer_notes",
        "internal_notes",
        "confirmed_at",
        "cancelled_at",
        "cancellation_reason",
        "completed_at",
        "created_at",
      ],
      filters,
      pagination: { skip: Number(offset), take: Number(limit) },
    });

    return res.json({
      items: bookings,
      count: Array.isArray(bookings) ? bookings.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET vendor bookings");
  }
}
