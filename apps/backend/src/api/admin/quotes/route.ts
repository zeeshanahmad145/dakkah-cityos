import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { handleApiError } from "../../../lib/api-error-handler"

// GET /admin/quotes - List all quotes
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any
  
    const { status, company_id, customer_id, limit = "50", offset = "0" } = req.query
  
    const filters: Record<string, unknown> = {}
    if (status) filters.status = status
    if (company_id) filters.company_id = company_id
    if (customer_id) filters.customer_id = customer_id
  
    const { data: quotes } = await query.graph({
      entity: "quote",
      fields: [
        "id", "quote_number", "company_id", "customer_id", "cart_id",
        "status", "subtotal", "discount_total", "tax_total", "shipping_total", "total",
        "currency_code", "custom_discount_percentage", "custom_discount_amount",
        "discount_reason", "valid_from", "valid_until", "reviewed_by", "reviewed_at",
        "rejection_reason", "accepted_at", "declined_at", "customer_notes", "internal_notes",
        "metadata", "created_at", "updated_at"
      ],
      filters,
      pagination: {
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      },
    })
  
    // Enrich with company and customer info
    const enrichedQuotes = await Promise.all(quotes.map(async (quote: Record<string, unknown>) => {
      let company = null
      let customer = null
    
      if (quote.company_id) {
        const { data: companies } = await query.graph({
          entity: "company",
          fields: ["id", "name", "email"],
          filters: { id: quote.company_id },
        })
        company = companies[0] || null
      }
    
      if (quote.customer_id) {
        const { data: customers } = await query.graph({
          entity: "customer",
          fields: ["id", "email", "first_name", "last_name"],
          filters: { id: quote.customer_id },
        })
        customer = customers[0] || null
      }
    
      // Get quote items count
      const { data: items } = await query.graph({
        entity: "quote_item",
        fields: ["id"],
        filters: { quote_id: quote.id },
      })
    
      return { 
        ...quote, 
        company, 
        customer,
        items_count: items.length,
        customer_email: customer?.email || company?.email || "Unknown"
      }
    }))
  
    res.json({ quotes: enrichedQuotes, count: enrichedQuotes.length })

  } catch (error: unknown) {
    handleApiError(res, error, "GET admin quotes")}
}

