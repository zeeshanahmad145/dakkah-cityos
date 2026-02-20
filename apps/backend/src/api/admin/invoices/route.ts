/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createInvoiceSchema = z.object({
  customer_id: z.string(),
  order_id: z.string().optional(),
  amount: z.number(),
  currency_code: z.string().optional().default("usd"),
  due_date: z.string(),
  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unit_price: z.number(),
  })).optional(),
}).strict()

interface CityOSContext {
  tenantId?: string
  storeId?: string
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const invoiceModule = req.scope.resolve("invoice") as any
    const cityosContext = (req as any).cityosContext as CityOSContext | undefined

    const filters: any = {}
    if (cityosContext?.tenantId && cityosContext.tenantId !== "default") {
      filters.tenant_id = cityosContext.tenantId
    }

    const { status, customer_id, overdue } = req.query as Record<string, string | undefined>
    if (status) filters.status = status
    if (customer_id) filters.customer_id = customer_id
    if (overdue === "true") {
      filters.due_date = { $lt: new Date().toISOString() }
      filters.status = "unpaid"
    }

    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0

    const invoices = await invoiceModule.listInvoices(filters, { skip: offset, take: limit })

    res.json({
      invoices,
      count: Array.isArray(invoices) ? invoices.length : 0,
      limit,
      offset,
    })
  } catch (error) {
    handleApiError(res, error, "GET admin invoices")
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = createInvoiceSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const invoiceModule = req.scope.resolve("invoice") as any
    const cityosContext = (req as any).cityosContext as CityOSContext | undefined

    const invoice = await invoiceModule.createInvoices({
      ...parsed.data,
      tenant_id: cityosContext?.tenantId || "default",
    })

    res.status(201).json({ invoice })
  } catch (error) {
    handleApiError(res, error, "POST admin invoices")
  }
}
