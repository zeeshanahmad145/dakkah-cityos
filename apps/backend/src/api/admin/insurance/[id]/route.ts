import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(["product", "shipping", "warranty-ext"]).optional(),
  coverage_amount: z.number().optional(),
  premium: z.number().optional(),
  deductible: z.number().optional(),
  duration_days: z.number().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  tenant_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("insurance") as any
    const { id } = req.params
    const [item] = await mod.listInsurancePlans({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin insurance id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("insurance") as any
    const { id } = req.params
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    const item = await mod.updateInsurancePlans({ id, ...parsed.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin insurance id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("insurance") as any
    const { id } = req.params
    await mod.deleteInsurancePlans([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin insurance id")}
}
