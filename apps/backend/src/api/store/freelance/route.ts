import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createGigListingSchema = z.object({
  tenant_id: z.string().min(1),
  freelancer_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  listing_type: z.enum(["fixed_price", "hourly", "milestone"]),
  price: z.number().optional(),
  hourly_rate: z.number().optional(),
  currency_code: z.string().min(1),
  delivery_time_days: z.number().optional(),
  revisions_included: z.number().optional(),
  status: z.enum(["draft", "active", "paused", "completed", "suspended"]).optional(),
  skill_tags: z.array(z.string()).optional(),
  portfolio_urls: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("freelance") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      category,
      min_price,
      max_price,
      delivery_time,
      skill,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (category) filters.category = category
    if (min_price) filters.min_price = Number(min_price)
    if (max_price) filters.max_price = Number(max_price)
    if (delivery_time) filters.delivery_time = Number(delivery_time)
    if (skill) filters.skill = skill
    if (search) filters.search = search
    filters.status = "active"

    const items = await mod.listGigListings(filters, { skip: Number(offset), take: Number(limit) })
    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-FREELANCE")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createGigListingSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("freelance") as any
    const item = await mod.createGigListings(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-FREELANCE")}
}
