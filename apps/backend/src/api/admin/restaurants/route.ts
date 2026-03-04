import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    cuisine_types: z.any().optional(),
    address_line1: z.string().min(1),
    address_line2: z.string().nullable().optional(),
    city: z.string().min(1),
    state: z.string().nullable().optional(),
    postal_code: z.string().min(1),
    country_code: z.string().min(1),
    phone: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    tenant_id: z.string().min(1),
    handle: z.string().min(1),
    operating_hours: z.any().optional(),
    is_active: z.boolean().optional(),
    is_accepting_orders: z.boolean().optional(),
    avg_prep_time_minutes: z.number().optional(),
    delivery_radius_km: z.number().nullable().optional(),
    min_order_amount: z.number().nullable().optional(),
    delivery_fee: z.number().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const moduleService = req.scope.resolve("restaurant") as unknown as any;
  const { limit = "20", offset = "0" } = req.query as Record<
    string,
    string | undefined
  >;
  const items = await moduleService.listRestaurants(
    {},
    { skip: Number(offset), take: Number(limit) },
  );
  return res.json({
    items,
    count: Array.isArray(items) ? items.length : 0,
    limit: Number(limit),
    offset: Number(offset),
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const moduleService = req.scope.resolve("restaurant") as unknown as any;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  const raw = await moduleService.createRestaurants(parsed.data);
    const item = Array.isArray(raw) ? raw[0] : raw;
  return res.status(201).json({ item });
}
