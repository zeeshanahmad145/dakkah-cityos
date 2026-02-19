import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const rejectQuoteSchema = z.object({
  rejection_reason: z.string().optional(),
  internal_notes: z.string().optional(),
}).passthrough()

// POST /admin/quotes/:id/reject
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const quoteModule = req.scope.resolve("quote")
    const { id } = req.params
  
    const parsed = rejectQuoteSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const { rejection_reason, internal_notes } = parsed.data
  
    const quote = await quoteModule.updateQuotes({
      id,
      status: "rejected",
      reviewed_at: new Date(),
      rejection_reason,
      internal_notes,
    })
  
    res.json({ quote })

  } catch (error: any) {
    handleApiError(res, error, "POST admin quotes id reject")}
}

