import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  utility_type: z.enum(["electricity", "water", "gas", "internet", "phone", "cable", "waste"]).optional(),
  provider_name: z.string().optional(),
  account_number: z.string().optional(),
  meter_number: z.string().optional(),
  address: z.any().optional(),
  status: z.enum(["active", "suspended", "closed"]).optional(),
  auto_pay: z.boolean().optional(),
  payment_method_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("utilities") as any
    const { id } = req.params
    const [item] = await mod.listUtilityAccounts({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin utilities id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("utilities") as any
    const { id } = req.params
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    const item = await mod.updateUtilityAccounts({ id, ...parsed.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin utilities id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("utilities") as any
    const { id } = req.params
    await mod.deleteUtilityAccounts([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin utilities id")}
}

