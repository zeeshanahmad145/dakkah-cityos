import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  product_id: z.string().optional(),
  tiers: z.array(z.object({ min_qty: z.number(), price: z.number() })).optional(),
  min_order_qty: z.number().optional(),
  max_discount_percent: z.number().optional(),
  status: z.enum(["active", "inactive", "expired"]).optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  tenant_id: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("volumeDeals") as any
    const { limit = "20", offset = "0" } = req.query as Record<string, string | undefined>
    const items = await mod.listVolumeDeals({}, { skip: Number(offset), take: Number(limit) })
    return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })

  } catch (error: any) {
    handleApiError(res, error, "GET admin volume-deals")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("volumeDeals") as any
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    const item = await mod.createVolumeDeals(parsed.data)
    return res.status(201).json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin volume-deals")}
}
