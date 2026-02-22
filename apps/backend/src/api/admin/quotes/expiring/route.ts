// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const extendQuotesSchema = z.object({
  quote_ids: z.array(z.string()),
  extend_days: z.number(),
  notify_customers: z.boolean().optional(),
}).passthrough()

// GET - List expiring and expired quotes
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { days_until_expiry = 7, include_expired = "true" } = req.query as {
    days_until_expiry?: number
    include_expired?: string
  }

  const query = req.scope.resolve("query")
  const now = new Date()
  const futureDate = new Date(now.getTime() + Number(days_until_expiry) * 24 * 60 * 60 * 1000)

  // Get quotes expiring soon
  const { data: expiringQuotes } = await query.graph({
    entity: "quote",
    fields: [
      "id",
      "quote_number",
      "status",
      "total",
      "valid_until",
      "customer_id",
      "customer.email",
      "customer.first_name",
      "customer.last_name",
      "company_id",
      "company.name",
      "created_at"
    ],
    filters: {
      status: { $in: ["pending", "approved"] },
      valid_until: { 
        $gte: now.toISOString(),
        $lte: futureDate.toISOString() 
      }
    }
  })

  // Get expired quotes if requested
  let expiredQuotes: any[] = []
  if (include_expired === "true") {
    const result = await query.graph({
      entity: "quote",
      fields: [
        "id",
        "quote_number",
        "status",
        "total",
        "valid_until",
        "customer_id",
        "customer.email",
        "company_id",
        "company.name"
      ],
      filters: {
        status: { $in: ["pending", "approved"] },
        valid_until: { $lt: now.toISOString() }
      }
    })
    expiredQuotes = result.data
  }

  // Calculate days until expiry
  const quotesWithDays = expiringQuotes.map((quote: any) => {
    const validUntil = new Date(quote.valid_until)
    const daysUntil = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return {
      ...quote,
      days_until_expiry: daysUntil,
      is_expired: false
    }
  })

  const expiredWithDays = expiredQuotes.map((quote: any) => {
    const validUntil = new Date(quote.valid_until)
    const daysSince = Math.floor((now.getTime() - validUntil.getTime()) / (1000 * 60 * 60 * 24))
    return {
      ...quote,
      days_since_expiry: daysSince,
      is_expired: true
    }
  })

  res.json({
    expiring_soon: quotesWithDays.sort((a, b) => a.days_until_expiry - b.days_until_expiry),
    expired: expiredWithDays.sort((a, b) => a.days_since_expiry - b.days_since_expiry),
    summary: {
      expiring_count: quotesWithDays.length,
      expired_count: expiredWithDays.length,
      total_expiring_value: quotesWithDays.reduce((sum, q) => sum + q.total, 0),
      total_expired_value: expiredWithDays.reduce((sum, q) => sum + q.total, 0)
    }
  })
}

// POST - Extend quote validity
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const parsed = extendQuotesSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  const { quote_ids, extend_days, notify_customers } = parsed.data

  const quoteService = req.scope.resolve("quoteModuleService")
  const query = req.scope.resolve("query")

  if (extend_days < 1) {
    return res.status(400).json({ message: "Extension must be at least 1 day" })
  }

  const results = []

  for (const quoteId of quote_ids) {
    try {
      const { data: quotes } = await query.graph({
        entity: "quote",
        fields: ["id", "valid_until", "customer.email"],
        filters: { id: quoteId }
      })

      if (!quotes.length) {
        results.push({ quote_id: quoteId, status: "not_found" })
        continue
      }

      const quote = quotes[0]
      const currentExpiry = new Date(quote.valid_until)
      const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()) + extend_days * 24 * 60 * 60 * 1000)

      await quoteService.updateQuotes({
        selector: { id: quoteId },
        data: { valid_until: newExpiry }
      })

      if (notify_customers) {
        // TODO: Send notification email
      }

      results.push({ 
        quote_id: quoteId, 
        status: "extended", 
        new_valid_until: newExpiry 
      })
    } catch (error: any) {
      results.push({ quote_id: quoteId, status: "error", error: error.message })}
  }

  res.json({
    message: `Extended ${results.filter(r => r.status === "extended").length} quotes`,
    results
  })
}

