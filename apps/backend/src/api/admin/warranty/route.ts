import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    plan_type: z.enum(["standard", "extended", "premium", "accidental"]),
    duration_months: z.number(),
    price: z.number().optional(),
    currency_code: z.string(),
    coverage: z.any(),
    exclusions: z.any().optional(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("warranty") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      status,
    } = req.query as Record<string, string | undefined>;
    const filters: Record<string, any> = {};
    if (status) filters.is_active = status === "active";
    const items = await mod.listWarrantyPlans(filters, {
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
    handleApiError(res, error, "GET admin warranty");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("warranty") as unknown as any;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const item = await mod.createWarrantyPlans(parsed.data);
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin warranty");
  }
}
