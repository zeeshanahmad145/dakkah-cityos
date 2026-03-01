import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    supplier_id: z.string().optional(),
    product_id: z.string().optional(),
    supplier_price: z.number().optional(),
    retail_price: z.number().optional(),
    shipping_time_days: z.number().optional(),
    status: z.enum(["active", "inactive", "out-of-stock"]).optional(),
    tenant_id: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("dropshipping") as unknown as any;
    const { id } = req.params;
    const [item] = await mod.listDropshipProducts({ id }, { take: 1 });
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin dropshipping id");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("dropshipping") as unknown as any;
    const { id } = req.params;
    const validation = updateSchema.safeParse(req.body);
    if (!validation.success)
      return res
        .status(400)
        .json({
          message: "Validation failed",
          errors: validation.error.issues,
        });
    const item = await mod.updateDropshipProducts({ id, ...validation.data });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin dropshipping id");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("dropshipping") as unknown as any;
    const { id } = req.params;
    await mod.deleteDropshipProducts([id]);
    return res.status(204).send();
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin dropshipping id");
  }
}
