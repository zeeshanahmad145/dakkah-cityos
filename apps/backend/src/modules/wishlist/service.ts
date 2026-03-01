import { MedusaService } from "@medusajs/framework/utils";
import Wishlist from "./models/wishlist";
import WishlistItem from "./models/wishlist-item";
import crypto from "crypto";

type WishlistRecord = {
  id: string;
  customer_id: string;
  tenant_id: string;
  title: string;
  is_default: boolean;
  visibility: "private" | "shared" | "public";
  share_token: string | null;
  metadata: Record<string, unknown> | null;
};

type WishlistItemRecord = {
  id: string;
  wishlist_id: string;
  product_id: string;
  variant_id: string | null;
  added_at: Date | null;
  priority: string;
  notes: string | null;
  metadata: Record<string, unknown> | null;
};

interface WishlistServiceBase {
  retrieveWishlist(id: string): Promise<WishlistRecord>;
  listWishlists(filters?: Record<string, unknown>): Promise<WishlistRecord[]>;
  createWishlists(data: Record<string, unknown>): Promise<WishlistRecord>;
  updateWishlists(data: Record<string, unknown>): Promise<WishlistRecord>;
  retrieveWishlistItem(id: string): Promise<WishlistItemRecord>;
  listWishlistItems(
    filters?: Record<string, unknown>,
  ): Promise<WishlistItemRecord[]>;
  createWishlistItems(
    data: Record<string, unknown>,
  ): Promise<WishlistItemRecord>;
  updateWishlistItems(
    data: Record<string, unknown>,
  ): Promise<WishlistItemRecord>;
  deleteWishlistItems(id: string): Promise<void>;
}

const Base = MedusaService({ Wishlist, WishlistItem });

class WishlistModuleService extends Base implements WishlistServiceBase {
  async addItem(data: {
    wishlistId: string;
    productId: string;
    variantId?: string;
    priority?: "low" | "medium" | "high";
    notes?: string;
    metadata?: Record<string, unknown>;
  }): Promise<WishlistItemRecord> {
    const existing = await this.listWishlistItems({
      wishlist_id: data.wishlistId,
      product_id: data.productId,
      variant_id: data.variantId ?? null,
    }) as any;
    if (existing.length > 0)
      throw new Error("Item already exists in this wishlist");

    return this.createWishlistItems({
      wishlist_id: data.wishlistId,
      product_id: data.productId,
      variant_id: data.variantId ?? null,
      added_at: new Date(),
      priority: data.priority ?? "medium",
      notes: data.notes ?? null,
      metadata: data.metadata ?? null,
    } as any);
  }

  async removeItem(
    wishlistId: string,
    itemId: string,
  ): Promise<{ success: boolean }> {
    const item = await this.retrieveWishlistItem(itemId) as any;
    if (item.wishlist_id !== wishlistId)
      throw new Error("Item does not belong to this wishlist");
    await this.deleteWishlistItems(itemId);
    return { success: true };
  }

  async moveItem(
    itemId: string,
    fromWishlistId: string,
    toWishlistId: string,
  ): Promise<WishlistItemRecord> {
    const item = await this.retrieveWishlistItem(itemId) as any;
    if (item.wishlist_id !== fromWishlistId) {
      throw new Error("Item does not belong to the source wishlist");
    }
    await this.retrieveWishlist(toWishlistId) as any; // validates target exists
    await this.updateWishlistItems({ id: itemId, wishlist_id: toWishlistId } as any);
    return this.retrieveWishlistItem(itemId);
  }

  async shareWishlist(
    wishlistId: string,
    visibility: "private" | "shared" | "public",
  ): Promise<WishlistRecord> {
    const wishlist = await this.retrieveWishlist(wishlistId) as any;
    let shareToken: string | null = wishlist.share_token;
    if (visibility !== "private" && !shareToken) {
      shareToken = crypto.randomBytes(16).toString("hex");
    }
    if (visibility === "private") {
      shareToken = null;
    }
    await this.updateWishlists({
      id: wishlistId,
      visibility,
      share_token: shareToken,
    } as any);
    return this.retrieveWishlist(wishlistId);
  }

  async getByShareToken(shareToken: string): Promise<WishlistRecord> {
    const wishlists = await this.listWishlists({
      share_token: shareToken,
      visibility: ["shared", "public"],
    }) as any;
    if (wishlists.length === 0)
      throw new Error("Wishlist not found or not shared");
    return wishlists[0];
  }

  async getCustomerWishlists(
    customerId: string,
    tenantId: string,
  ): Promise<WishlistRecord[]> {
    return this.listWishlists({ customer_id: customerId, tenant_id: tenantId });
  }

  async getOrCreateDefault(
    customerId: string,
    tenantId: string,
  ): Promise<WishlistRecord> {
    const existing = await this.listWishlists({
      customer_id: customerId,
      tenant_id: tenantId,
      is_default: true,
    }) as any;
    if (existing.length > 0) return existing[0];

    return this.createWishlists({
      customer_id: customerId,
      tenant_id: tenantId,
      title: "My Wishlist",
      is_default: true,
      visibility: "private",
    } as any);
  }
}

export default WishlistModuleService;
