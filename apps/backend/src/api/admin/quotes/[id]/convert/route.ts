// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const convertQuoteSchema = z.object({
  notify_customer: z.boolean().optional(),
}).passthrough()

// POST - Convert quote to order (admin)
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const parsed = convertQuoteSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }
  const { notify_customer } = parsed.data
  
  const query = req.scope.resolve("query") as unknown as any
  const quoteService = req.scope.resolve("quoteModuleService") as unknown as any

  const { data: quotes } = await query.graph({
    entity: "quote",
    fields: [
      "id", 
      "status", 
      "customer_id", 
      "company_id",
      "items.*",
      "total",
      "discount_total",
      "shipping_address.*",
      "billing_address.*",
      "valid_until"
    ],
    filters: { id }
  })

  if (!quotes.length) {
    return res.status(404).json({ message: "Quote not found" })
  }

  const quote = quotes[0]

  // Validate quote status
  if (quote.status !== "approved") {
    return res.status(400).json({ 
      message: "Only approved quotes can be converted to orders" 
    })
  }

  // Check if quote is still valid
  if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
    return res.status(400).json({ 
      message: "Quote has expired. Please create a new quote." 
    })
  }

  try {
    // Create cart from quote
    const cartService = req.scope.resolve("cartModuleService") as unknown as any
    
    const cart = await cartService.createCarts({
      customer_id: quote.customer_id,
      metadata: {
        quote_id: quote.id,
        converted_by_admin: true
      }
    })

    // Add items from quote to cart
    for (const item of quote.items || []) {
      await cartService.addLineItems(cart.id, {
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      })
    }

    // Apply quote discount if any
    if (quote.discount_total > 0) {
      // TODO: Apply discount to cart
    }

    // Update quote status
    await quoteService.updateQuotes({
      selector: { id },
      data: {
        status: "converted",
        converted_at: new Date(),
        cart_id: cart.id
      }
    })

    // Notify customer if requested
    if (notify_customer) {
      // TODO: Send notification to customer
    }

    res.json({
      message: "Quote converted to cart successfully",
      quote_id: id,
      cart_id: cart.id
    })
  } catch (error: unknown) {
    handleApiError(res, error, "ADMIN-QUOTES-ID-CONVERT")}
}

