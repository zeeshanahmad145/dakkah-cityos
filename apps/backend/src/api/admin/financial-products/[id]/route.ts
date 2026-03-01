import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    loan_type: z
      .enum(["personal", "business", "mortgage", "auto", "education", "micro"])
      .optional(),
    min_amount: z.number().optional(),
    max_amount: z.number().optional(),
    currency_code: z.string().optional(),
    interest_rate_min: z.number().optional(),
    interest_rate_max: z.number().optional(),
    interest_type: z.enum(["fixed", "variable", "reducing_balance"]).optional(),
    min_term_months: z.number().optional(),
    max_term_months: z.number().optional(),
    processing_fee_pct: z.number().optional(),
    requirements: z.any().optional(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("financialProduct") as unknown as any;
    const { id } = req.params;
    const [item] = await mod.listLoanProducts({ id }, { take: 1 });
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin financial-products id");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("financialProduct") as unknown as any;
    const { id } = req.params;
    const validation = updateSchema.safeParse(req.body);
    if (!validation.success)
      return res
        .status(400)
        .json({
          message: "Validation failed",
          errors: validation.error.issues,
        });
    const item = await mod.updateLoanProducts({ id, ...validation.data });
    return res.json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin financial-products id");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("financialProduct") as unknown as any;
    const { id } = req.params;
    await mod.deleteLoanProducts([id]);
    return res.status(204).send();
  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin financial-products id");
  }
}
