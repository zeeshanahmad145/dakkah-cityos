import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any
  
    const { limit = 20, offset = 0, status, company_id } = req.query as {
      limit?: number
      offset?: number
      status?: string
      company_id?: string
    }
  
    const filters: Record<string, any> = {}
    if (status) filters.status = status
    if (company_id) filters.company_id = company_id
  
    const { data: purchase_orders, metadata } = await query.graph({
      entity: "purchase_order",
      fields: [
        "id",
        "company_id",
        "customer_id",
        "po_number",
        "status",
        "submitted_at",
        "approved_at",
        "approved_by",
        "rejected_at",
        "rejected_by",
        "rejection_reason",
        "notes",
        "subtotal",
        "tax_total",
        "shipping_total",
        "discount_total",
        "total",
        "currency_code",
        "created_at",
        "items.*",
        "company.name",
      ],
      filters,
      pagination: { skip: Number(offset), take: Number(limit) },
    })
  
    res.json({
      purchase_orders,
      count: metadata?.count || purchase_orders.length,
      offset: Number(offset),
      limit: Number(limit),
    })

  } catch (error: unknown) {
    handleApiError(res, error, "GET admin purchase-orders")}
}

