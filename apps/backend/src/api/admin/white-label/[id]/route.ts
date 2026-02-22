import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  product_id: z.string().optional(),
  brand_name: z.string().optional(),
  customization_options: z.any().optional(),
  base_cost: z.number().optional(),
  retail_price: z.number().optional(),
  status: z.enum(["active", "inactive", "discontinued"]).optional(),
  tenant_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("whiteLabel") as any
    const { id } = req.params
    const [item] = await mod.listWhiteLabelProducts({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin white-label id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("whiteLabel") as any
    const { id } = req.params
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    const item = await mod.updateWhiteLabelProducts({ id, ...parsed.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin white-label id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("whiteLabel") as any
    const { id } = req.params
    await mod.deleteWhiteLabelProducts([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin white-label id")}
}
