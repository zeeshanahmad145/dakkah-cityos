import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    name: z.string().min(1).optional(),
    slug: z.string().optional(),
    code: z.string().nullable().optional(),
    location: z.any().nullable().optional(),
    status: z.enum(["active", "inactive", "maintenance"]).optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("node") as unknown as any;
    const { id } = req.params;
    const [item] = await moduleService.listNodes({ id }, { take: 1 });
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin nodes id");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("node") as unknown as any;
    const { id } = req.params;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const item = await moduleService.updateNodes({ id, ...parsed.data });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin nodes id");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("node") as unknown as any;
    const { id } = req.params;
    await moduleService.deleteNodes([id]);
    return res.status(204).send();
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin nodes id");
  }
}
