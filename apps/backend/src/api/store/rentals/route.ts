import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createRentalSchema = z.object({
  tenant_id: z.string().min(1).optional(),
  product_id: z.string().min(1).optional(),
  rental_type: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  daily_rate: z.number().optional(),
  weekly_rate: z.number().optional(),
  monthly_rate: z.number().optional(),
  deposit_amount: z.number().optional(),
  currency_code: z.string().optional(),
  is_available: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("rental") as any
    const { limit = "20", offset = "0", tenant_id, rental_type } = req.query as Record<string, string | undefined>
    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (rental_type) filters.rental_type = rental_type
    filters.is_available = true
    const items = await mod.listRentalProducts(filters, { skip: Number(offset), take: Number(limit) })
    return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })
  } catch (error: any) {
    handleApiError(res, error, "STORE-RENTALS")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createRentalSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("rental") as any
    const item = await mod.createRentalProducts(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-RENTALS")}
}
