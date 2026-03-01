import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  event_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.number(),
  currency_code: z.string().min(1),
  quantity_available: z.number().int(),
  ticket_type: z
    .enum(["general", "vip", "early_bird", "group", "student", "reserved"])
    .optional(),
  sale_starts_at: z.string().nullable().optional(),
  sale_ends_at: z.string().nullable().optional(),
  max_per_order: z.number().int().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorId = req.vendor_id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const mod = req.scope.resolve("eventTicketing") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      event_id,
      status,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = { vendor_id: vendorId };
    if (event_id) filters.event_id = event_id;
    if (status) filters.status = status;

    const items = await mod.listEventTickets(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    });

    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET vendor event-ticketing");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorId = req.vendor_id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const mod = req.scope.resolve("eventTicketing") as unknown as any;
    const body = req.body as Record<string, unknown>;
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const item = await mod.createEventTickets({
      ...validation.data,
      vendor_id: vendorId,
    });

    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST vendor event-ticketing");
  }
}
