import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const approveQuoteSchema = z.object({
  quoted_price: z.number().optional(),
  custom_discount_percentage: z.number().optional(),
  custom_discount_amount: z.number().optional(),
  discount_reason: z.string().optional(),
  valid_until: z.string().optional(),
  internal_notes: z.string().optional(),
}).passthrough()

// POST /admin/quotes/:id/approve
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const quoteModule = req.scope.resolve("quote") as unknown as any
    const { id } = req.params
  
    const parsed = approveQuoteSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const { 
      quoted_price,
      custom_discount_percentage,
      custom_discount_amount,
      discount_reason,
      valid_until,
      internal_notes,
    } = parsed.data
  
    // Set default validity of 30 days if not provided
    const defaultValidUntil = new Date()
    defaultValidUntil.setDate(defaultValidUntil.getDate() + 30)
  
    const quote = await quoteModule.updateQuotes({
      id,
      status: "approved",
      reviewed_at: new Date(),
      valid_from: new Date(),
      valid_until: valid_until ? new Date(valid_until) : defaultValidUntil,
      custom_discount_percentage,
      custom_discount_amount: custom_discount_amount || quoted_price,
      discount_reason,
      internal_notes,
    })
  
    res.json({ quote })

  } catch (error: unknown) {
    handleApiError(res, error, "POST admin quotes id approve")}
}

