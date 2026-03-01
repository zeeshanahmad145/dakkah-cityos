import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  event_type: z.enum([
    "concert",
    "conference",
    "workshop",
    "sports",
    "festival",
    "webinar",
    "meetup",
    "other",
  ]),
  venue_id: z.string().nullable().optional(),
  address: z.any().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  timezone: z.string().optional(),
  is_online: z.boolean().optional(),
  online_url: z.string().nullable().optional(),
  max_capacity: z.number().nullable().optional(),
  organizer_name: z.string().nullable().optional(),
  organizer_email: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  status: z
    .enum(["draft", "published", "live", "completed", "cancelled"])
    .optional(),
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
      status,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = { vendor_id: vendorId };
    if (status) filters.status = status;

    const items = await mod.listEvents(filters, {
      skip: Number(offset),
      take: Number(limit),
    });

    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET vendor events");
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
    const validation = createSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const item = await mod.createEvents({
      ...validation.data,
      vendor_id: vendorId,
    });

    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST vendor events");
  }
}
