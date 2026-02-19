import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateWishlistSchema = z.object({
  name: z.string().min(1).optional(),
  product_id: z.string().min(1).optional(),
  variant_id: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("wishlist") as any
    const item = await service.retrieveWishlist(req.params.id)
    res.json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-WISHLISTS-ID")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = updateWishlistSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const service = req.scope.resolve("wishlist") as any
    const item = await service.updateWishlists(req.params.id, parsed.data)
    res.json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-WISHLISTS-ID")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }
    const service = req.scope.resolve("wishlist") as any
    await service.deleteWishlists(req.params.id)
    res.status(200).json({ id: req.params.id, deleted: true })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-WISHLISTS-ID")}
}
