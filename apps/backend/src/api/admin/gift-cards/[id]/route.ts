import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  code: z.string().optional(),
  value: z.number().optional(),
  balance: z.number().optional(),
  currency_code: z.string().optional(),
  recipient_email: z.string().optional(),
  sender_name: z.string().optional(),
  message: z.string().optional(),
  expires_at: z.string().optional(),
  status: z.enum(["active", "redeemed", "expired", "disabled"]).optional(),
  tenant_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("giftCard") as any
    const { id } = req.params
    const [item] = await mod.listGiftCards({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin gift-cards id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("giftCard") as any
    const { id } = req.params
    const validation = updateSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await mod.updateGiftCards({ id, ...validation.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin gift-cards id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("giftCard") as any
    const { id } = req.params
    await mod.deleteGiftCards([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin gift-cards id")}
}
