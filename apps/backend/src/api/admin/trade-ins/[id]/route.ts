import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    product_id: z.string().optional(),
    customer_id: z.string().optional(),
    condition: z.enum(["excellent", "good", "fair", "poor"]).optional(),
    estimated_value: z.number().optional(),
    offered_value: z.number().optional(),
    status: z
      .enum(["pending", "appraised", "accepted", "rejected", "completed"])
      .optional(),
    tenant_id: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("tradeIn") as unknown as any;
    const { id } = req.params;
    const [item] = await mod.listTradeIns({ id }, { take: 1 });
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin trade-ins id");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("tradeIn") as unknown as any;
    const { id } = req.params;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const item = await mod.updateTradeIns({ id, ...parsed.data });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin trade-ins id");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("tradeIn") as unknown as any;
    const { id } = req.params;
    await mod.deleteTradeIns([id]);
    return res.status(204).send();
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin trade-ins id");
  }
}
