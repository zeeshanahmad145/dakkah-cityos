import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createSchema = z.object({
  tenant_id: z.string(),
  product_id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  auction_type: z.enum(["english", "dutch", "sealed", "reserve"]),
  starting_price: z.number(),
  reserve_price: z.number().optional(),
  buy_now_price: z.number().optional(),
  currency_code: z.string(),
  bid_increment: z.number(),
  starts_at: z.string(),
  ends_at: z.string(),
  auto_extend: z.boolean().optional(),
  extend_minutes: z.number().optional(),
  status: z.enum(["draft", "scheduled", "active", "ended", "cancelled"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("auction") as any
    const { limit = "20", offset = "0" } = req.query as Record<string, string | undefined>
    const items = await mod.listAuctionListings({}, { skip: Number(offset), take: Number(limit) })
    return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })

  } catch (error: any) {
    handleApiError(res, error, "GET admin auctions")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("auction") as any
    const validation = createSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await mod.createAuctionListings(validation.data)
    return res.status(201).json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin auctions")}
}

