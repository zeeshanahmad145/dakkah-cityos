import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    product_type: z.string().optional(),
    design_url: z.string().optional(),
    base_cost: z.number().optional(),
    retail_price: z.number().optional(),
    provider: z.string().optional(),
    status: z.enum(["active", "inactive", "discontinued"]).optional(),
    tenant_id: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("printOnDemand") as unknown as any;
    const { id } = req.params;
    const [item] = await mod.listPodProducts({ id }, { take: 1 });
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin print-on-demand id");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("printOnDemand") as unknown as any;
    const { id } = req.params;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const item = await mod.updatePodProducts({ id, ...parsed.data });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin print-on-demand id");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("printOnDemand") as unknown as any;
    const { id } = req.params;
    await mod.deletePodProducts([id]);
    return res.status(204).send();
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin print-on-demand id");
  }
}
