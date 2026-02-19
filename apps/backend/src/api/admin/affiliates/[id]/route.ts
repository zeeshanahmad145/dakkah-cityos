import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  affiliate_type: z.enum(["standard", "influencer", "partner", "ambassador"]).optional(),
  status: z.enum(["pending", "approved", "active", "suspended", "terminated"]).optional(),
  commission_rate: z.number().optional(),
  commission_type: z.enum(["percentage", "flat"]).optional(),
  payout_method: z.enum(["bank_transfer", "paypal", "store_credit"]).optional(),
  payout_minimum: z.number().optional(),
  bio: z.string().optional(),
  social_links: z.any().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("affiliate") as any
    const { id } = req.params
    const [item] = await mod.listAffiliates({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin affiliates id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("affiliate") as any
    const { id } = req.params
    const validation = updateSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await mod.updateAffiliates({ id, ...validation.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin affiliates id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("affiliate") as any
    const { id } = req.params
    await mod.deleteAffiliates([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin affiliates id")}
}

