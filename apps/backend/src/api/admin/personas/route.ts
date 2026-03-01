import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().min(1),
    category: z.enum([
      "consumer",
      "creator",
      "business",
      "cityops",
      "platform",
    ]),
    axes: z.any().nullable().optional(),
    constraints: z.any().nullable().optional(),
    allowed_workflows: z.any().nullable().optional(),
    allowed_tools: z.any().nullable().optional(),
    allowed_surfaces: z.any().nullable().optional(),
    feature_overrides: z.any().nullable().optional(),
    priority: z.number().optional(),
    tenant_id: z.string().min(1),
    status: z.enum(["active", "inactive"]).optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("persona") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      category,
    } = req.query as Record<string, string | undefined>;
    const filters: Record<string, any> = {};
    if (tenant_id) filters.tenant_id = tenant_id;
    if (category) filters.category = category;
    const items = await moduleService.listPersonas(filters, {
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
    handleApiError(res, error, "GET admin personas");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("persona") as unknown as any;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const item = await moduleService.createPersonas(parsed.data);
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin personas");
  }
}
