import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  discount_percent: z.number().optional(),
  original_price: z.number().optional(),
  sale_price: z.number().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  stock_limit: z.number().optional(),
  status: z.enum(["scheduled", "active", "ended", "cancelled"]).optional(),
  tenant_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("promotionExt") as any
    const { id } = req.params
    const [item] = await mod.listProductBundles({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin flash-deals id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("promotionExt") as any
    const { id } = req.params
    const validation = updateSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await mod.updateProductBundles({ id, ...validation.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin flash-deals id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("promotionExt") as any
    const { id } = req.params
    await mod.deleteProductBundles([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin flash-deals id")}
}
