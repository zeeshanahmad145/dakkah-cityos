import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

/**
 * GET /store/wishlists/:id/share
 * Returns a shareable link for a wishlist using its share_token.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const wishlistService = req.scope.resolve("wishlist") as unknown as any;
    const wishlistId = req.params.id;
    const customerId = req.auth_context?.actor_id;

    const wishlists = await wishlistService.listWishlists?.({ id: wishlistId });
    const list = Array.isArray(wishlists)
      ? wishlists
      : [wishlists].filter(Boolean);
    const wishlist = list[0];

    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }

    // Only allow owner or public wishlists to be shared
    if (
      wishlist.visibility !== "public" &&
      wishlist.customer_id !== customerId
    ) {
      return res.status(403).json({ error: "This wishlist is private" });
    }

    const shareToken = wishlist.share_token || wishlist.id;
    const shareUrl = `/store/wishlists/shared/${shareToken}`;

    return res.json({
      wishlist_id: wishlistId,
      share_token: shareToken,
      share_url: shareUrl,
      visibility: wishlist.visibility,
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-WISHLIST-SHARE");
  }
}
