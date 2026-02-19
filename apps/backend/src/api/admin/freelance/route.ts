import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createSchema = z.object({
  tenant_id: z.string(),
  freelancer_id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  listing_type: z.enum(["fixed_price", "hourly", "milestone"]),
  price: z.number().optional(),
  hourly_rate: z.number().optional(),
  currency_code: z.string(),
  delivery_time_days: z.number().optional(),
  revisions_included: z.number().optional(),
  status: z.enum(["draft", "active", "paused", "completed", "suspended"]).optional(),
  skill_tags: z.array(z.string()).optional(),
  portfolio_urls: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("freelance") as any
    const { limit = "20", offset = "0" } = req.query as Record<string, string | undefined>
    const items = await mod.listGigListings({}, { skip: Number(offset), take: Number(limit) })
    return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })

  } catch (error: any) {
    handleApiError(res, error, "GET admin freelance")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("freelance") as any
    const validation = createSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await mod.createGigListings(validation.data)
    return res.status(201).json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin freelance")}
}

