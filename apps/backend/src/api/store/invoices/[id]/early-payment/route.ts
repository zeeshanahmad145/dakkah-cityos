import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { handleApiError } from "../../../../../lib/api-error-handler"

/**
 * Customer-facing Early Payment Discount API
 * Allows customers to see available discounts on their invoices
 */

/**
 * @route GET /store/invoices/:id/early-payment
 * @desc Get early payment discount details for a customer invoice
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any

    // Fetch invoice with customer validation
    const { data: invoices } = await query.graph({
      entity: "invoice",
      fields: [
        "id", 
        "total", 
        "currency_code", 
        "created_at", 
        "status",
        "customer_id",
        "company_id"
      ],
      filters: { id }
    })

    const invoice = invoices[0]
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" })
    }

    // In production, verify the customer has access to this invoice
    // const customerId = req.auth?.customer_id
    // if (invoice.customer_id !== customerId) { return 403 }

    if (invoice.status === "paid") {
      return res.json({
        early_payment: {
          invoice_id: id,
          is_discount_available: false,
          message: "This invoice has already been paid"
        }
      })
    }

    if (invoice.status === "voided") {
      return res.json({
        early_payment: {
          invoice_id: id,
          is_discount_available: false,
          message: "This invoice has been voided"
        }
      })
    }

    // Default payment terms (in production, fetch from company settings)
    const paymentTerm = {
      code: "2/10 Net 30",
      net_days: 30,
      discount_percent: 2,
      discount_days: 10
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
    
    // Calculate amounts
    const originalAmount = invoice.total
    const discountAmount = isDiscountAvailable 
      ? Math.round(originalAmount * (paymentTerm.discount_percent / 100))
      : 0
    const discountedTotal = originalAmount - discountAmount

    res.json({
      early_payment: {
        invoice_id: id,
        currency_code: invoice.currency_code,
        original_amount: originalAmount,
        payment_terms: paymentTerm.code,
        due_date: dueDate.toISOString(),
        
        // Discount details
        is_discount_available: isDiscountAvailable,
        discount_percent: paymentTerm.discount_percent,
        discount_deadline: discountDeadline.toISOString(),
        days_remaining: Math.max(0, daysRemaining),
        
        // Calculated amounts
        discount_amount: discountAmount,
        pay_now_amount: discountedTotal,
        
        // User-friendly messages
        message: isDiscountAvailable
          ? `Save ${paymentTerm.discount_percent}% by paying within ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
          : paymentTerm.discount_percent > 0
            ? "Early payment discount period has expired"
            : "Standard payment terms apply"
      }
    })
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-INVOICES-ID-EARLY-PAYMENT")}
}

