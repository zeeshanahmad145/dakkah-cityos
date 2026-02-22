import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  rental_type: z.enum(["daily", "weekly", "monthly", "hourly", "custom"]).optional(),
  base_price: z.number().optional(),
  currency_code: z.string().optional(),
  deposit_amount: z.number().optional(),
  late_fee_per_day: z.number().optional(),
  min_duration: z.number().optional(),
  max_duration: z.number().optional(),
  is_available: z.boolean().optional(),
  condition_on_listing: z.enum(["new", "like_new", "good", "fair"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("rental") as any
    const { id } = req.params
    const [item] = await mod.listRentalProducts({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin rentals id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("rental") as any
    const { id } = req.params
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    const item = await mod.updateRentalProducts({ id, ...parsed.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin rentals id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("rental") as any
    const { id } = req.params
    await mod.deleteRentalProducts([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin rentals id")}
}

