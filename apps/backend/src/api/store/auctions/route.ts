import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createAuctionListingSchema = z.object({
  tenant_id: z.string().min(1),
  product_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  auction_type: z.enum(["english", "dutch", "sealed", "reserve"]),
  status: z.enum(["draft", "scheduled", "active", "ended", "cancelled"]).optional(),
  starting_price: z.number(),
  reserve_price: z.number().optional(),
  buy_now_price: z.number().optional(),
  current_price: z.number().optional(),
  currency_code: z.string().min(1),
  bid_increment: z.number(),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  auto_extend: z.boolean().optional(),
  extend_minutes: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("auction") as any
    const { limit = "20", offset = "0", tenant_id, auction_type } = req.query as Record<string, string | undefined>
    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (auction_type) filters.auction_type = auction_type
    filters.status = "active"
    const items = await mod.listAuctionListings(filters, { skip: Number(offset), take: Number(limit) })
    return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })
  } catch (error: any) {
    handleApiError(res, error, "STORE-AUCTIONS")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createAuctionListingSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("auction") as any
    const item = await mod.createAuctionListings(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-AUCTIONS")}
}
