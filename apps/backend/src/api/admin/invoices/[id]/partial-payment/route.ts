// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const partialPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be greater than 0"),
  payment_method: z.string(),
  reference: z.string().optional(),
  notes: z.string().optional(),
}).passthrough()

// POST - Record partial payment on invoice
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const parsed = partialPaymentSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const { id } = req.params
    const { amount, payment_method, reference, notes } = parsed.data

    const query = req.scope.resolve("query") as unknown as any
    const invoiceService = req.scope.resolve("invoiceModuleService") as unknown as any

    const { data: invoices } = await query.graph({
      entity: "invoice",
      fields: ["id", "status", "total", "amount_paid", "amount_due", "payments.*"],
      filters: { id }
    })

    if (!invoices.length) {
      return res.status(404).json({ message: "Invoice not found" })
    }

    const invoice = invoices[0]

    // Validate invoice status
    if (["paid", "voided", "cancelled"].includes(invoice.status)) {
      return res.status(400).json({ 
        message: `Cannot add payment to a ${invoice.status} invoice` 
      })
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ message: "Payment amount must be greater than 0" })
    }

    const amountDue = invoice.total - (invoice.amount_paid || 0)
    if (amount > amountDue) {
      return res.status(400).json({ 
        message: `Payment amount (${amount}) exceeds amount due (${amountDue})` 
      })
    }

    // Record the payment
    const newAmountPaid = (invoice.amount_paid || 0) + amount
    const newAmountDue = invoice.total - newAmountPaid
    const newStatus = newAmountDue <= 0 ? "paid" : "partially_paid"

    // Create payment record
    const payment = {
      invoice_id: id,
      amount,
      payment_method,
      reference,
      notes,
      paid_at: new Date()
    }

    // Update invoice
    await invoiceService.updateInvoices({
      selector: { id },
      data: {
        status: newStatus,
        amount_paid: newAmountPaid,
        amount_due: newAmountDue,
        payments: [...(invoice.payments || []), payment],
        ...(newStatus === "paid" && { paid_at: new Date() })
      }
    })

    res.json({
      message: "Payment recorded successfully",
      invoice_id: id,
      payment_amount: amount,
      total_paid: newAmountPaid,
      amount_due: newAmountDue,
      status: newStatus
    })

  } catch (error: unknown) {
    handleApiError(res, error, "POST admin invoices id partial-payment")}
}

// GET - Get payment history for invoice
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const query = req.scope.resolve("query") as unknown as any

    const { data: invoices } = await query.graph({
      entity: "invoice",
      fields: ["id", "total", "amount_paid", "amount_due", "payments.*"],
      filters: { id }
    })

    if (!invoices.length) {
      return res.status(404).json({ message: "Invoice not found" })
    }

    const invoice = invoices[0]

    res.json({
      invoice_id: id,
      total: invoice.total,
      amount_paid: invoice.amount_paid || 0,
      amount_due: invoice.total - (invoice.amount_paid || 0),
      payments: invoice.payments || []
    })

  } catch (error: unknown) {
    handleApiError(res, error, "GET admin invoices id partial-payment")}
}

