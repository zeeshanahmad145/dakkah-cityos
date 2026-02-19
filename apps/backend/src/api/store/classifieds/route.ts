import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createClassifiedSchema = z.object({
  tenant_id: z.string().min(1),
  seller_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category_id: z.string().nullable().optional(),
  subcategory_id: z.string().nullable().optional(),
  listing_type: z.enum(["sell", "buy", "trade", "free", "wanted"]),
  condition: z.enum(["new", "like_new", "good", "fair", "poor"]).optional(),
  price: z.union([z.string(), z.number()]).nullable().optional(),
  currency_code: z.string().min(1),
  is_negotiable: z.boolean().optional(),
  location_city: z.string().nullable().optional(),
  location_state: z.string().nullable().optional(),
  location_country: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  status: z.enum(["draft", "active", "sold", "expired", "flagged", "removed"]).optional(),
  expires_at: z.string().nullable().optional(),
  promoted_until: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("classified") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      category,
      location,
      min_price,
      max_price,
      condition,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (category) filters.category = category
    if (location) filters.location = location
    if (min_price) filters.min_price = Number(min_price)
    if (max_price) filters.max_price = Number(max_price)
    if (condition) filters.condition = condition
    if (search) filters.search = search
    filters.status = "active"

    const items = await mod.listClassifiedListings(filters, { skip: Number(offset), take: Number(limit) })
    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-CLASSIFIEDS")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createClassifiedSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("classified") as any
    const item = await mod.createClassifiedListings(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-CLASSIFIEDS")}
}

