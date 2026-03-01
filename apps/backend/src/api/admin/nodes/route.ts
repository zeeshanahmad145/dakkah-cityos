import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().min(1),
    code: z.string().nullable().optional(),
    type: z.enum(["CITY", "DISTRICT", "ZONE", "FACILITY", "ASSET"]),
    parent_id: z.string().nullable().optional(),
    tenant_id: z.string().min(1),
    location: z.any().nullable().optional(),
    status: z.enum(["active", "inactive", "maintenance"]).optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("node") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      type,
      parent_id,
    } = req.query as Record<string, string | undefined>;
    const filters: Record<string, any> = {};
    if (tenant_id) filters.tenant_id = tenant_id;
    if (type) filters.type = type;
    if (parent_id) filters.parent_id = parent_id;
    const items = await moduleService.listNodes(filters, {
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
    handleApiError(res, error, "GET admin nodes");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("node") as unknown as any;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const item = await moduleService.createNodeWithValidation(parsed.data);
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin nodes");
  }
}
