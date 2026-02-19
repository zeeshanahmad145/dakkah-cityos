import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createAdPlacementSchema = z.object({
  tenant_id: z.string().min(1),
  name: z.string().min(1),
  placement_type: z.enum([
    "homepage_banner",
    "category_page",
    "search_results",
    "product_page",
    "sidebar",
    "footer",
    "email",
    "push",
  ]),
  dimensions: z.record(z.string(), z.unknown()).optional(),
  max_ads: z.number().optional(),
  price_per_day: z.number().optional(),
  currency_code: z.string().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("advertising") as any
    const { limit = "20", offset = "0", tenant_id, placement_type, status } = req.query as Record<string, string | undefined>
    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (placement_type) filters.placement_type = placement_type
    if (status) filters.status = status
    const items = await mod.listAdPlacements(filters, { skip: Number(offset), take: Number(limit) })
    return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })
  } catch (error: any) {
    handleApiError(res, error, "STORE-ADVERTISING")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createAdPlacementSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("advertising") as any
    const item = await mod.createAdPlacements(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-ADVERTISING")}
}
