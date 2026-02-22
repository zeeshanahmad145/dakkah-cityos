import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createCampaignSchema = z.object({
  tenant_id: z.string().min(1),
  creator_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  short_description: z.string().nullable().optional(),
  campaign_type: z.enum(["reward", "equity", "donation", "debt"]),
  status: z.enum(["draft", "pending_review", "active", "funded", "failed", "cancelled"]).optional(),
  goal_amount: z.union([z.string(), z.number()]),
  currency_code: z.string().min(1),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().min(1),
  is_flexible_funding: z.boolean().optional(),
  category: z.string().nullable().optional(),
  images: z.any().nullable().optional(),
  video_url: z.string().nullable().optional(),
  risks_and_challenges: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("crowdfunding") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      status,
      category,
      min_goal,
      max_goal,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (status) filters.status = status
    if (category) filters.category = category
    if (min_goal) filters.min_goal = Number(min_goal)
    if (max_goal) filters.max_goal = Number(max_goal)
    if (search) filters.search = search

    const items = await mod.listCrowdfundCampaigns(filters, { skip: Number(offset), take: Number(limit) })
    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-CROWDFUNDING")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createCampaignSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("crowdfunding") as any
    const item = await mod.createCrowdfundCampaigns(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-CROWDFUNDING")}
}

