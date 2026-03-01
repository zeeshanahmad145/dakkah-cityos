import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    cuisine_types: z.any().optional(),
    address_line1: z.string().optional(),
    address_line2: z.string().nullable().optional(),
    city: z.string().optional(),
    state: z.string().nullable().optional(),
    postal_code: z.string().optional(),
    country_code: z.string().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    handle: z.string().optional(),
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
  const { id } = req.params;
  const [item] = await moduleService.listRestaurants({ id }, { take: 1 });
  if (!item) return res.status(404).json({ message: "Not found" });
  return res.json({ item });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const moduleService = req.scope.resolve("restaurant") as unknown as any;
  const { id } = req.params;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  const item = await moduleService.updateRestaurants({ id, ...parsed.data });
  return res.json({ item });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const moduleService = req.scope.resolve("restaurant") as unknown as any;
  const { id } = req.params;
  await moduleService.deleteRestaurants([id]);
  return res.status(204).send();
}
