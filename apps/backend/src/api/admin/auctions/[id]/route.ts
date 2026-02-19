import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  auction_type: z.enum(["english", "dutch", "sealed", "reserve"]).optional(),
  starting_price: z.number().optional(),
  reserve_price: z.number().optional(),
  buy_now_price: z.number().optional(),
  currency_code: z.string().optional(),
  bid_increment: z.number().optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  auto_extend: z.boolean().optional(),
  extend_minutes: z.number().optional(),
  status: z.enum(["draft", "scheduled", "active", "ended", "cancelled"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("auction") as any
    const { id } = req.params
    const [item] = await mod.listAuctionListings({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin auctions id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("auction") as any
    const { id } = req.params
    const validation = updateSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await mod.updateAuctionListings({ id, ...validation.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin auctions id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("auction") as any
    const { id } = req.params
    await mod.deleteAuctionListings([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin auctions id")}
}

