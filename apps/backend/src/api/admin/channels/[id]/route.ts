import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  channel_type: z.enum(["web", "mobile", "api", "kiosk", "internal"]).optional(),
  medusa_sales_channel_id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  node_id: z.string().optional(),
  config: z.any().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("channel") as any
    const { id } = req.params
    const [item] = await mod.listSalesChannelMappings({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin channels id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("channel") as any
    const { id } = req.params
    const validation = updateSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await mod.updateSalesChannelMappings({ id, ...validation.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin channels id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("channel") as any
    const { id } = req.params
    await mod.deleteSalesChannelMappings([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin channels id")}
}

