import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const markHelpfulSchema = z.object({})

// POST /store/reviews/:id/helpful - Mark a review as helpful
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const parsed = markHelpfulSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  const reviewService = req.scope.resolve("review")
  const { id } = req.params

  try {
    await reviewService.markHelpful(id)
    res.json({ success: true })
  } catch (error: any) {
    handleApiError(res, error, "STORE-REVIEWS-ID-HELPFUL")}
}

