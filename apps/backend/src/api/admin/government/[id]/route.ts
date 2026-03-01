import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    request_type: z
      .enum([
        "maintenance",
        "complaint",
        "inquiry",
        "permit",
        "license",
        "inspection",
        "emergency",
      ])
      .optional(),
    category: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
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
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("government") as unknown as any;
    const { id } = req.params;
    const [item] = await mod.listServiceRequests({ id }, { take: 1 });
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin government id");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("government") as unknown as any;
    const { id } = req.params;
    const validation = updateSchema.safeParse(req.body);
    if (!validation.success)
      return res
        .status(400)
        .json({
          message: "Validation failed",
          errors: validation.error.issues,
        });
    const item = await mod.updateServiceRequests({ id, ...validation.data });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin government id");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("government") as unknown as any;
    const { id } = req.params;
    await mod.deleteServiceRequests([id]);
    return res.status(204).send();
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin government id");
  }
}
