import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

interface IWishlistItem {
  id: string;
  customer_id: string;
  name?: string;
  tenant_id?: string;
  product_id?: string;
  variant_id?: string;
  metadata?: Record<string, unknown>;
  created_at?: Date;
}

interface IWishlistModuleService {
  listAndCountWishlists(
    filters: Partial<IWishlistItem>,
    config?: { take?: number; skip?: number },
  ): Promise<[IWishlistItem[], number]>;
  createWishlists(data: Partial<IWishlistItem>): Promise<IWishlistItem>;
  deleteWishlists(ids: string[]): Promise<void>;
}

const createWishlistSchema = z.object({
  name: z.string().min(1).optional(),
  tenant_id: z.string().min(1).optional(),
  product_id: z.string().min(1).optional(),
  variant_id: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("wishlist") as IWishlistModuleService;
    const customerId = req.auth_context?.actor_id;
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const [items, count] = await service.listAndCountWishlists(
      { customer_id: customerId },
      { take: limit, skip: offset },
    );
    return res.json({ items, count, limit, offset });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-WISHLISTS");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("wishlist") as IWishlistModuleService;
    const customerId = req.auth_context?.actor_id;
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const parsed = createWishlistSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const item = await service.createWishlists({
      ...parsed.data,
      customer_id: customerId,
    });
    return res.status(201).json({ item });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-WISHLISTS");
  }
}
