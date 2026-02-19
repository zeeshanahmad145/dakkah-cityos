import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  consigner_id: z.string().optional(),
  product_id: z.string().optional(),
  condition: z.enum(["new", "like-new", "good", "fair", "poor"]).optional(),
  asking_price: z.number().optional(),
  commission_rate: z.number().optional(),
  status: z.enum(["pending", "listed", "sold", "returned", "expired"]).optional(),
  tenant_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("consignment") as any
    const { id } = req.params
    const [item] = await mod.listConsignments({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin consignments id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("consignment") as any
    const { id } = req.params
    const validation = updateSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await mod.updateConsignments({ id, ...validation.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin consignments id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("consignment") as any
    const { id } = req.params
    await mod.deleteConsignments([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin consignments id")}
}
