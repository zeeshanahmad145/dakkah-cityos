import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const replySchema = z.object({
  review_id: z.string().min(1),
  reply: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorId = req.vendor_id;
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" });
  }

  const mod = req.scope.resolve("review") as unknown as any;
  const {
    limit = "20",
    offset = "0",
    rating,
    status,
    product_id,
  } = req.query as Record<string, string | undefined>;

  const filters: Record<string, any> = { vendor_id: vendorId };
  if (rating) filters.rating = Number(rating);
  if (status) filters.status = status;
  if (product_id) filters.product_id = product_id;

  const items = await mod.listReviews(filters, {
    skip: Number(offset),
    take: Number(limit),
    order: { created_at: "DESC" },
  });

  return res.json({
    items,
    count: Array.isArray(items) ? items.length : 0,
    limit: Number(limit),
    offset: Number(offset),
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const vendorId = req.vendor_id;
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" });
  }

  const mod = req.scope.resolve("review") as unknown as any;
  const body = req.body as Record<string, unknown>;
  const validation = replySchema.safeParse(body);
  if (!validation.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: validation.error.issues });
  }

  try {
    const existing = await mod.retrieveReview(validation.data.review_id);
    if (!existing || existing.vendor_id !== vendorId) {
      return res
        .status(403)
        .json({ message: "Not authorized to reply to this review" });
    }
  } catch {
    return res.status(404).json({ message: "Review not found" });
  }

  const item = await mod.updateReviews(validation.data.review_id, {
    vendor_reply: validation.data.reply,
    vendor_reply_at: new Date().toISOString(),
    vendor_id: vendorId,
  });

  return res.json({ item });
}
