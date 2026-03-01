import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    title: z.string().optional(),
    file_url: z.string().optional(),
    file_type: z
      .enum([
        "pdf",
        "video",
        "audio",
        "image",
        "archive",
        "ebook",
        "software",
        "other",
      ])
      .optional(),
    file_size_bytes: z.number().optional(),
    preview_url: z.string().optional(),
    version: z.string().optional(),
    max_downloads: z.number().optional(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("digitalProduct") as unknown as any;
    const { id } = req.params;
    const [item] = await mod.listDigitalAssets({ id }, { take: 1 });
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin digital-products id");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("digitalProduct") as unknown as any;
    const { id } = req.params;
    const validation = updateSchema.safeParse(req.body);
    if (!validation.success)
      return res
        .status(400)
        .json({
          message: "Validation failed",
          errors: validation.error.issues,
        });
    const item = await mod.updateDigitalAssets({ id, ...validation.data });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin digital-products id");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("digitalProduct") as unknown as any;
    const { id } = req.params;
    await mod.deleteDigitalAssets([id]);
    return res.status(204).send();
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin digital-products id");
  }
}
