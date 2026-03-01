import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    locale: z.string().optional(),
    namespace: z.string().optional(),
    key: z.string().optional(),
    value: z.string().optional(),
    context: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("i18n") as unknown as any;
    const { id } = req.params;
    const [item] = await mod.listTranslations({ id }, { take: 1 });
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin i18n id");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("i18n") as unknown as any;
    const { id } = req.params;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const item = await mod.updateTranslations({ id, ...parsed.data });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin i18n id");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("i18n") as unknown as any;
    const { id } = req.params;
    await mod.deleteTranslations([id]);
    return res.status(204).send();
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin i18n id");
  }
}
