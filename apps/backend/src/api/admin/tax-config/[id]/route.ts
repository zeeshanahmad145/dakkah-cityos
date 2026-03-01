import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateTaxConfigSchema = z
  .object({
    tax_rate: z.number().optional(),
    tax_type: z.enum(["vat", "gst", "sales_tax", "excise"]).optional(),
    product_category: z.string().optional(),
    status: z.enum(["active", "inactive"]).optional(),
    region_id: z.string().optional(),
    tenant_id: z.string().optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("taxConfig") as unknown as any;
    const item = await service.retrieveTaxRule(req.params.id);
    res.json({ item });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-TAX-CONFIG-ID");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("taxConfig") as unknown as any;
    const parsed = updateTaxConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }
    const item = await service.updateTaxRules(req.params.id, parsed.data);
    res.json({ item });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-TAX-CONFIG-ID");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("taxConfig") as unknown as any;
    await service.deleteTaxRules(req.params.id);
    res.status(200).json({ id: req.params.id, deleted: true });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-TAX-CONFIG-ID");
  }
}
