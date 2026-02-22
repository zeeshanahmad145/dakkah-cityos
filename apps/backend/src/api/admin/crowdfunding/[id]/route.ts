import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  campaign_type: z.enum(["reward", "equity", "donation", "debt"]).optional(),
  status: z.enum(["draft", "pending_review", "active", "funded", "failed", "cancelled"]).optional(),
  goal_amount: z.number().optional(),
  currency_code: z.string().optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  is_flexible_funding: z.boolean().optional(),
  category: z.string().optional(),
  images: z.any().optional(),
  video_url: z.string().optional(),
  risks_and_challenges: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("crowdfunding") as any
    const { id } = req.params
    const [item] = await mod.listCrowdfundCampaigns({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin crowdfunding id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("crowdfunding") as any
    const { id } = req.params
    const validation = updateSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await mod.updateCrowdfundCampaigns({ id, ...validation.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin crowdfunding id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("crowdfunding") as any
    const { id } = req.params
    await mod.deleteCrowdfundCampaigns([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin crowdfunding id")}
}

