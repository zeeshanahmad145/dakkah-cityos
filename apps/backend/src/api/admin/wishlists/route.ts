import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createWishlistSchema = z
  .object({
    customer_id: z.string().optional(),
    name: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("wishlist") as unknown as any;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const [items, count] = await service.listAndCountWishlists(
      {},
      { take: limit, skip: offset },
    );
    res.json({ items, count, limit, offset });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-WISHLISTS");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("wishlist") as unknown as any;
    const parsed = createWishlistSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }
    const item = await service.createWishlists(parsed.data);
    res.status(201).json({ item });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-WISHLISTS");
  }
}
