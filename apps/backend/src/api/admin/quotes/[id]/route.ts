import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateQuoteSchema = z.object({
  custom_discount_percentage: z.number().optional(),
  custom_discount_amount: z.number().optional(),
  discount_reason: z.string().optional(),
  valid_until: z.string().optional(),
  internal_notes: z.string().optional(),
}).passthrough()

// GET /admin/quotes/:id
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any
    const { id } = req.params
  
    const { data: quotes } = await query.graph({
      entity: "quote",
      fields: ["*"],
      filters: { id },
    })
  
    if (!quotes.length) {
      return res.status(404).json({ message: "Quote not found" })
    }
  
    const quote = quotes[0]
  
    // Fetch items
    const { data: items } = await query.graph({
      entity: "quote_item",
      fields: ["*"],
      filters: { quote_id: id },
    })
  
    // Fetch company and customer
    let company = null
    let customer = null
  
    if (quote.company_id) {
      const { data: companies } = await query.graph({
        entity: "company",
        fields: ["id", "name", "email", "phone"],
        filters: { id: quote.company_id },
      })
      company = companies[0] || null
    }
  
    if (quote.customer_id) {
      const { data: customers } = await query.graph({
        entity: "customer",
        fields: ["id", "email", "first_name", "last_name", "phone"],
        filters: { id: quote.customer_id },
      })
      customer = customers[0] || null
    }
  
    res.json({ quote: { ...quote, items, company, customer } })

  } catch (error: unknown) {
    handleApiError(res, error, "GET admin quotes id")}
}

// PUT /admin/quotes/:id - Update quote
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const quoteModule = req.scope.resolve("quote") as unknown as any
    const { id } = req.params
  
    const parsed = updateQuoteSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const {
      custom_discount_percentage,
      custom_discount_amount,
      discount_reason,
      valid_until,
      internal_notes,
    } = parsed.data
  
    const updateData: Record<string, unknown> = { id }
    if (custom_discount_percentage !== undefined) updateData.custom_discount_percentage = custom_discount_percentage
    if (custom_discount_amount !== undefined) updateData.custom_discount_amount = custom_discount_amount
    if (discount_reason !== undefined) updateData.discount_reason = discount_reason
    if (valid_until !== undefined) updateData.valid_until = valid_until ? new Date(valid_until) : null
    if (internal_notes !== undefined) updateData.internal_notes = internal_notes
  
    const quote = await quoteModule.updateQuotes(updateData)
  
    res.json({ quote })

  } catch (error: unknown) {
    handleApiError(res, error, "PUT admin quotes id")}
}

