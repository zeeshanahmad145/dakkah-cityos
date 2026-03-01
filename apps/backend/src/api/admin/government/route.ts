import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string(),
    citizen_id: z.string(),
    request_type: z.enum([
      "maintenance",
      "complaint",
      "inquiry",
      "permit",
      "license",
      "inspection",
      "emergency",
    ]),
    category: z.string().optional(),
    title: z.string(),
    description: z.string(),
    location: z.any().optional(),
    status: z
      .enum([
        "submitted",
        "acknowledged",
        "in_progress",
        "resolved",
        "closed",
        "rejected",
      ])
      .optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    assigned_to: z.string().optional(),
    department: z.string().optional(),
    resolution: z.string().optional(),
    resolved_at: z.string().optional(),
    photos: z.any().optional(),
    reference_number: z.string(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("government") as unknown as any;
    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;
    const items = await mod.listServiceRequests(
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
    handleApiError(res, error, "GET admin government");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("government") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success)
      return res
        .status(400)
        .json({
          message: "Validation failed",
          errors: validation.error.issues,
        });
    const item = await mod.createServiceRequests(validation.data);
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin government");
  }
}
