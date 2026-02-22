import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createFinancialProductSchema = z.object({
  name: z.string().min(1),
  product_type: z.string().min(1),
  interest_rate: z.number().optional(),
  term: z.number().optional(),
  tenant_id: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("financialProduct") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      product_type,
      min_rate,
      max_rate,
      term,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (product_type) filters.product_type = product_type
    if (min_rate) filters.min_rate = Number(min_rate)
    if (max_rate) filters.max_rate = Number(max_rate)
    if (term) filters.term = Number(term)
    if (search) filters.search = search

    const items = await mod.listLoanProducts(filters, { skip: Number(offset), take: Number(limit) })
    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-FINANCIAL-PRODUCTS")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createFinancialProductSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("financialProduct") as any
    const item = await mod.createLoanProducts(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-FINANCIAL-PRODUCTS")}
}

