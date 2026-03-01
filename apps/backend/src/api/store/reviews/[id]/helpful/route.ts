import { z } from "zod";
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

const markHelpfulSchema = z.object({});

// POST /store/reviews/:id/helpful - Mark a review as helpful
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const reviewService = req.scope.resolve("review") as unknown as any;
  const { id } = req.params;

  try {
    await reviewService.markHelpful(id);
    res.json({ success: true });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-REVIEWS-ID-HELPFUL");
  }
}
