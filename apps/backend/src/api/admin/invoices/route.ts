import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createInvoiceSchema = z.object({
  company_id: z.string(),
  customer_id: z.string().optional(),
  issue_date: z.string(),
  due_date: z.string(),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  payment_terms: z.string().optional(),
  payment_terms_days: z.number().optional(),
  currency_code: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    order_id: z.string().optional(),
    order_display_id: z.string().optional(),
    quantity: z.number(),
    unit_price: z.number(),
  })),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

// GET /admin/invoices - List all invoices
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
    const { status, company_id, customer_id, date_from, date_to } = req.query
  
    const filters: Record<string, unknown> = {}
    if (status) filters.status = status
    if (company_id) filters.company_id = company_id
    if (customer_id) filters.customer_id = customer_id
    if (date_from || date_to) {
      filters.issue_date = {}
      if (date_from) (filters.issue_date as Record<string, string>).$gte = date_from as string
      if (date_to) (filters.issue_date as Record<string, string>).$lte = date_to as string
    }
  
    const { data: invoices } = await query.graph({
      entity: "invoice",
      fields: [
        "id", "invoice_number", "company_id", "customer_id", "status",
        "issue_date", "due_date", "paid_at", "subtotal", "tax_total",
        "discount_total", "total", "amount_paid", "amount_due", "currency_code",
        "payment_terms", "payment_terms_days", "notes", "pdf_url",
        "items.*", "created_at", "updated_at"
      ],
      filters,
    })
  
    // Fetch company and customer info for each invoice
    const enrichedInvoices = await Promise.all(invoices.map(async (invoice: Record<string, unknown>) => {
      let company = null
      let customer = null
    
      if (invoice.company_id) {
        const { data: companies } = await query.graph({
          entity: "company",
          fields: ["id", "name", "email"],
          filters: { id: invoice.company_id },
        })
        company = companies[0] || null
      }
    
      if (invoice.customer_id) {
        const { data: customers } = await query.graph({
          entity: "customer",
          fields: ["id", "email", "first_name", "last_name"],
          filters: { id: invoice.customer_id },
        })
        customer = customers[0] || null
      }
    
      return { ...invoice, company, customer }
    }))
  
    res.json({ invoices: enrichedInvoices })

  } catch (error: any) {
    handleApiError(res, error, "GET admin invoices")}
}

// POST /admin/invoices - Create a new invoice
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = createInvoiceSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const invoiceModule = req.scope.resolve("invoice")
  
    const {
      company_id,
      customer_id,
      issue_date,
      due_date,
      period_start,
      period_end,
      payment_terms,
      payment_terms_days,
      currency_code,
      notes,
      items,
      metadata,
    } = parsed.data
  
    const result = await invoiceModule.createInvoiceWithItems({
      company_id,
      customer_id,
      issue_date: new Date(issue_date),
      due_date: new Date(due_date),
      period_start: period_start ? new Date(period_start) : undefined,
      period_end: period_end ? new Date(period_end) : undefined,
      payment_terms,
      payment_terms_days,
      currency_code,
      notes,
      items,
      metadata,
    })
  
    res.status(201).json({ invoice: result.invoice, items: result.items })

  } catch (error: any) {
    handleApiError(res, error, "POST admin invoices")}
}

