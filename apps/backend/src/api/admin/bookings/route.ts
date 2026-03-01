/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createBookingSchema = z
  .object({
    customer_id: z.string(),
    service_product_id: z.string(),
    provider_id: z.string().optional(),
    start_time: z.string(),
    end_time: z.string(),
    notes: z.string().optional(),
    status: z.enum(["pending", "confirmed"]).optional().default("pending"),
  })
  .strict();

interface CityOSContext {
  tenantId?: string;
  storeId?: string;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bookingModule = req.scope.resolve("booking") as unknown as any;
    const cityosContext = req.cityosContext as CityOSContext | undefined;

    const filters: Record<string, unknown> = {};
    if (cityosContext?.tenantId && cityosContext.tenantId !== "default") {
      filters.tenant_id = cityosContext.tenantId;
    }

    const { status, customer_id, provider_id } = req.query as Record<
      string,
      string | undefined
    >;
    if (status) filters.status = status;
    if (customer_id) filters.customer_id = customer_id;
    if (provider_id) filters.provider_id = provider_id;

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const bookings = await bookingModule.listBookings(filters, {
      skip: offset,
      take: limit,
    });

    res.json({
      bookings,
      count: Array.isArray(bookings) ? bookings.length : 0,
      limit,
      offset,
    });
  } catch (error) {
    handleApiError(res, error, "GET admin bookings");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const bookingModule = req.scope.resolve("booking") as unknown as any;
    const cityosContext = req.cityosContext as CityOSContext | undefined;

    const booking = await bookingModule.createBookings({
      ...parsed.data,
      tenant_id: cityosContext?.tenantId || "default",
    });

    res.status(201).json({ booking });
  } catch (error) {
    handleApiError(res, error, "POST admin bookings");
  }
}
