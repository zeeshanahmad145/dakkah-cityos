import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string().min(1),
    region_id: z.string().min(1),
    tax_rate: z.number(),
    tax_type: z.enum(["vat", "gst", "sales_tax", "excise"]),
    product_category: z.string().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("taxConfig") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      region_id,
      tax_type,
      status,
      tenant_id,
    } = req.query as Record<string, string | undefined>;
    const filters: Record<string, any> = {};
    if (region_id) filters.region_id = region_id;
    if (tax_type) filters.tax_type = tax_type;
    if (status) filters.status = status;
    if (tenant_id) filters.tenant_id = tenant_id;
    const items = await moduleService.listTaxRules(filters, {
      skip: Number(offset),
      take: Number(limit),
    });
    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET admin tax-config");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("taxConfig") as unknown as any;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    const item = await moduleService.createTaxRules(parsed.data);
    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin tax-config");
  }
}
