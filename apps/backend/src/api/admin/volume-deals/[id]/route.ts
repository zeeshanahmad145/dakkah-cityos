import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  product_id: z.string().optional(),
  tiers: z.array(z.object({ min_qty: z.number(), price: z.number() })).optional(),
  min_order_qty: z.number().optional(),
  max_discount_percent: z.number().optional(),
  status: z.enum(["active", "inactive", "expired"]).optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  tenant_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("volumeDeals") as any
    const { id } = req.params
    const [item] = await mod.listVolumeDeals({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin volume-deals id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("volumeDeals") as any
    const { id } = req.params
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    const item = await mod.updateVolumeDeals({ id, ...parsed.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin volume-deals id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("volumeDeals") as any
    const { id } = req.params
    await mod.deleteVolumeDeals([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin volume-deals id")}
}
