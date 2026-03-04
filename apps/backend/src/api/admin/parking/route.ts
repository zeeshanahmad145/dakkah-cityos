import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    zone_type: z.enum([
      "street",
      "garage",
      "lot",
      "valet",
      "airport",
      "reserved",
    ]),
    address: z.any().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    total_spots: z.number(),
    available_spots: z.number(),
    hourly_rate: z.number().optional(),
    daily_rate: z.number().optional(),
    monthly_rate: z.number().optional(),
    currency_code: z.string(),
    operating_hours: z.any().optional(),
    is_active: z.boolean().optional(),
    has_ev_charging: z.boolean().optional(),
    has_disabled_spots: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("parking") as unknown as any;
    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;
    const items = await mod.listParkingZones(
      {},
      { skip: Number(offset), take: Number(limit) },
    );
    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin parking");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("parking") as unknown as any;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const raw = await mod.createParkingZones(parsed.data);
    const item = Array.isArray(raw) ? raw[0] : raw;
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin parking");
  }
}
