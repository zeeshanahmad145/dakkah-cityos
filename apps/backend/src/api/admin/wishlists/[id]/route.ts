import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateWishlistSchema = z
  .object({
    name: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("wishlist") as unknown as any;
    const wishlist = await service.retrieveWishlist(req.params.id);
    res.json({ wishlist });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-WISHLISTS-ID");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("wishlist") as unknown as any;
    const parsed = updateWishlistSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }
    const wishlist = await service.updateWishlists([
      { id: req.params.id, ...parsed.data },
    ]);
    const result = Array.isArray(wishlist) ? wishlist[0] : wishlist;
    res.json({ wishlist: result });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-WISHLISTS-ID");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("wishlist") as unknown as any;
    await service.deleteWishlists(req.params.id);
    res.status(200).json({ id: req.params.id, deleted: true });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-WISHLISTS-ID");
  }
}
