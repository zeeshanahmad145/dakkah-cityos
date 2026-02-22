import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createSchema = z.object({
  tenant_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  loan_type: z.enum(["personal", "business", "mortgage", "auto", "education", "micro"]),
  min_amount: z.number(),
  max_amount: z.number(),
  currency_code: z.string(),
  interest_rate_min: z.number(),
  interest_rate_max: z.number(),
  interest_type: z.enum(["fixed", "variable", "reducing_balance"]),
  min_term_months: z.number(),
  max_term_months: z.number(),
  processing_fee_pct: z.number().optional(),
  requirements: z.any().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("financialProduct") as any
    const { limit = "20", offset = "0" } = req.query as Record<string, string | undefined>
    const items = await mod.listLoanProducts({}, { skip: Number(offset), take: Number(limit) })
    return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })

  } catch (error: any) {
    handleApiError(res, error, "GET admin financial-products")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("financialProduct") as any
    const validation = createSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await mod.createLoanProducts(validation.data)
    return res.status(201).json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin financial-products")}
}

