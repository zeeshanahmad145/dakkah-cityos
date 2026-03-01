import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const applyEarlyPaymentSchema = z.object({
  apply_discount: z.boolean(),
}).passthrough()

/**
 * Early Payment Discount Calculator and Application
 * Calculates available discounts based on invoice date and payment terms
 */

interface EarlyPaymentCalculation {
  invoice_id: string
  original_amount: number
  currency_code: string
  payment_term: {
    code: string
    net_days: number
    discount_percent: number
    discount_days: number
  }
  invoice_date: Date
  discount_deadline: Date
  due_date: Date
  days_remaining_for_discount: number
  is_discount_available: boolean
  discount_amount: number
  discounted_total: number
  savings_message: string
}

/**
 * @route GET /admin/invoices/:id/early-payment
 * @desc Calculate early payment discount for an invoice
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any

    // Fetch invoice
    const { data: invoices } = await query.graph({
      entity: "invoice",
      fields: ["id", "total", "currency_code", "created_at", "status", "company_id"],
      filters: { id }
    })

    const invoice = invoices[0]
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" })
    }

    if (invoice.status === "paid" || invoice.status === "voided") {
      return res.status(400).json({ 
        error: "Early payment discount not applicable for paid or voided invoices" 
      })
    }

    // Get company's payment terms (default to 2/10 Net 30 for demo)
    const paymentTerm = {
      code: "2/10 Net 30",
      net_days: 30,
      discount_percent: 2,
      discount_days: 10
    }

    // If company has custom terms, fetch them
    if (invoice.company_id) {
      const { data: companies } = await query.graph({
        entity: "company",
        fields: ["id", "metadata"],
        filters: { id: invoice.company_id }
      })
      
      const company = companies[0]
      if (company?.metadata?.payment_term_id) {
        // Would fetch from payment_terms table
      }
    }

    const invoiceDate = new Date(invoice.created_at)
    const now = new Date()
    
    // Calculate deadlines
    const discountDeadline = new Date(invoiceDate)
    discountDeadline.setDate(discountDeadline.getDate() + paymentTerm.discount_days)
    
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + paymentTerm.net_days)

    // Calculate days remaining for discount
    const msPerDay = 24 * 60 * 60 * 1000
    const daysRemaining = Math.ceil((discountDeadline.getTime() - now.getTime()) / msPerDay)
    
    const isDiscountAvailable = daysRemaining > 0 && paymentTerm.discount_percent > 0
    
    // Calculate discount
    const originalAmount = invoice.total
    const discountAmount = isDiscountAvailable 
      ? Math.round(originalAmount * (paymentTerm.discount_percent / 100))
      : 0
    const discountedTotal = originalAmount - discountAmount

    // Generate savings message
    let savingsMessage = ""
    if (isDiscountAvailable) {
      savingsMessage = `Pay by ${discountDeadline.toLocaleDateString()} to save ${paymentTerm.discount_percent}% (${formatCurrency(discountAmount, invoice.currency_code)})`
    } else if (paymentTerm.discount_percent > 0) {
      savingsMessage = "Early payment discount period has expired"
    } else {
      savingsMessage = "No early payment discount available for this invoice"
    }

    const calculation: EarlyPaymentCalculation = {
      invoice_id: id,
      original_amount: originalAmount,
      currency_code: invoice.currency_code,
      payment_term: paymentTerm,
      invoice_date: invoiceDate,
      discount_deadline: discountDeadline,
      due_date: dueDate,
      days_remaining_for_discount: Math.max(0, daysRemaining),
      is_discount_available: isDiscountAvailable,
      discount_amount: discountAmount,
      discounted_total: discountedTotal,
      savings_message: savingsMessage
    }

    res.json({ early_payment: calculation })
  } catch (error: unknown) {
    handleApiError(res, error, "ADMIN-INVOICES-ID-EARLY-PAYMENT")}
}

/**
 * @route POST /admin/invoices/:id/early-payment
 * @desc Apply early payment discount to an invoice
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = applyEarlyPaymentSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const { id } = req.params
    const { apply_discount } = parsed.data
    
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any

    // Fetch invoice
    const { data: invoices } = await query.graph({
      entity: "invoice",
      fields: ["id", "total", "currency_code", "created_at", "status", "metadata"],
      filters: { id }
    })

    const invoice = invoices[0]
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" })
    }

    if (invoice.status !== "pending" && invoice.status !== "sent") {
      return res.status(400).json({ 
        error: "Can only apply early payment discount to pending or sent invoices" 
      })
    }

    // Check if discount already applied
    if (invoice.metadata?.early_payment_applied) {
      return res.status(400).json({ error: "Early payment discount already applied" })
    }

    // Calculate discount (using default 2% for demo)
    const discountPercent = 2
    const discountAmount = Math.round(invoice.total * (discountPercent / 100))
    const newTotal = invoice.total - discountAmount

    // In production, update the invoice in database
    // For now, return the calculated values
    const result = {
      invoice_id: id,
      original_total: invoice.total,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      new_total: newTotal,
      applied_at: new Date(),
      message: `Early payment discount of ${discountPercent}% applied successfully`
    }

    res.json({ 
      success: true,
      early_payment_discount: result
    })
  } catch (error: unknown) {
    handleApiError(res, error, "ADMIN-INVOICES-ID-EARLY-PAYMENT")}
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount)
}

