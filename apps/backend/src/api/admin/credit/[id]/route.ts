import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    customer_id: z.string().optional(),
    credit_limit: z.number().optional(),
    balance: z.number().optional(),
    currency_code: z.string().optional(),
    status: z.enum(["active", "suspended", "closed"]).optional(),
    tenant_id: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("credit") as unknown as any;
    const { id } = req.params;
    const [item] = await mod.listCreditAccounts({ id }, { take: 1 });
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin credit id");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("credit") as unknown as any;
    const { id } = req.params;
    const validation = updateSchema.safeParse(req.body);
    if (!validation.success)
      return res
        .status(400)
        .json({
          message: "Validation failed",
          errors: validation.error.issues,
        });
    const item = await mod.updateCreditAccounts({ id, ...validation.data });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin credit id");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("credit") as unknown as any;
    const { id } = req.params;
    await mod.deleteCreditAccounts([id]);
    return res.status(204).send();
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin credit id");
  }
}
