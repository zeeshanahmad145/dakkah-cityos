// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

// GET - List overdue invoices
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { days_overdue, limit = 50 } = req.query as { 
    days_overdue?: string
    limit?: number 
  }

  const query = req.scope.resolve("query") as unknown as any

  const { data: invoices } = await query.graph({
    entity: "invoice",
    fields: [
      "id",
      "invoice_number",
      "status",
      "total",
      "amount_paid",
      "amount_due",
      "due_date",
      "customer_id",
      "customer.email",
      "customer.first_name",
      "customer.last_name",
      "company_id",
      "company.name",
      "created_at"
    ],
    filters: {
      status: { $in: ["sent", "partially_paid"] },
      due_date: { $lt: new Date().toISOString() }
    },
    pagination: { take: Number(limit) }
  })

  // Calculate days overdue and filter if specified
  const now = new Date()
  const overdueInvoices = invoices.map((invoice: any) => {
    const dueDate = new Date(invoice.due_date)
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    return {
      ...invoice,
      days_overdue: daysOverdue,
      amount_due: invoice.total - (invoice.amount_paid || 0)
    }
  }).filter((invoice: any) => {
    if (days_overdue) {
      return invoice.days_overdue >= Number(days_overdue)
    }
    return true
  }).sort((a: any, b: any) => b.days_overdue - a.days_overdue)

  // Calculate summary statistics
  const summary = {
    total_count: overdueInvoices.length,
    total_amount_due: overdueInvoices.reduce((sum: number, inv: any) => sum + inv.amount_due, 0),
    by_age: {
      "1-7_days": overdueInvoices.filter((i: any) => i.days_overdue >= 1 && i.days_overdue <= 7).length,
      "8-30_days": overdueInvoices.filter((i: any) => i.days_overdue >= 8 && i.days_overdue <= 30).length,
      "31-60_days": overdueInvoices.filter((i: any) => i.days_overdue >= 31 && i.days_overdue <= 60).length,
      "60+_days": overdueInvoices.filter((i: any) => i.days_overdue > 60).length
    }
  }

  res.json({ 
    invoices: overdueInvoices,
    summary
  })
}

// POST - Send overdue reminders
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { invoice_ids, reminder_type } = req.body as {
    invoice_ids: string[]
    reminder_type: "email" | "all"
  }

  const query = req.scope.resolve("query") as unknown as any
  const invoiceService = req.scope.resolve("invoice") as unknown as any

  const { data: invoices } = await query.graph({
    entity: "invoice",
    fields: ["id", "invoice_number", "customer.email", "company.name", "total", "amount_due", "due_date"],
    filters: { id: { $in: invoice_ids } }
  })

  const results = []

  for (const invoice of invoices) {
    try {
      // Update last reminder sent
      await invoiceService.updateInvoices({
        selector: { id: invoice.id },
        data: {
          last_reminder_sent: new Date(),
          reminder_count: (invoice.reminder_count || 0) + 1
        }
      })

      // TODO: Send actual reminder email
      // await notificationService.send({
      //   to: invoice.customer.email,
      //   template: "invoice-overdue-reminder",
      //   data: { invoice }
      // })

      results.push({ invoice_id: invoice.id, status: "sent" })
    } catch (error: unknown) {
      results.push({ invoice_id: invoice.id, status: "failed", error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) })}
  }

  res.json({
    message: `Sent ${results.filter(r => r.status === "sent").length} reminders`,
    results
  })
}

