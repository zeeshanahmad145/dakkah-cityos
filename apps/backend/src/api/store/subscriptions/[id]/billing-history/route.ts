import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { handleApiError } from "../../../../../lib/api-error-handler"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const customerId = req.auth_context?.actor_id
  const { limit = "10", offset = "0" } = req.query as { limit?: string; offset?: string }
  
  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any
  
  try {
    // Verify subscription ownership
    const { data: subscriptions } = await query.graph({
      entity: "subscription",
      fields: ["id", "customer_id"],
      filters: { id, customer_id: customerId }
    })
    
    if (!subscriptions?.[0]) {
      return res.status(404).json({ message: "Subscription not found" })
    }
    
    // Get billing history from subscription_billing or orders with subscription metadata
    // First try subscription_billing entity
    try {
      const { data: billingRecords, metadata } = await query.graph({
        entity: "subscription_billing",
        fields: [
          "id",
          "amount",
          "currency_code",
          "status",
          "billing_date",
          "paid_at",
          "invoice_number",
          "created_at"
        ],
        filters: { subscription_id: id },
        pagination: {
          skip: Number(offset),
          take: Number(limit),
          order: { created_at: "DESC" }
        }
      })
      
      res.json({
        billing_history: billingRecords.map((record: any) => ({
          id: record.id,
          invoice_number: record.invoice_number || `INV-${record.id.slice(0, 8).toUpperCase()}`,
          amount: record.amount,
          currency: record.currency_code,
          status: record.status,
          date: record.billing_date || record.created_at,
          paid_at: record.paid_at,
        })),
        count: metadata?.count || billingRecords.length,
        limit: Number(limit),
        offset: Number(offset)
      })
    } catch {
      // Fallback: Get orders linked to this subscription
      const { data: orders } = await query.graph({
        entity: "order",
        fields: [
          "id",
          "display_id",
          "total",
          "currency_code",
          "status",
          "payment_status",
          "created_at"
        ],
        filters: {
          customer_id: customerId,
          // In practice, we'd filter by metadata.subscription_id
        },
        pagination: {
          skip: Number(offset),
          take: Number(limit),
          order: { created_at: "DESC" }
        }
      })
      
      // Filter to only orders related to this subscription
      const subscriptionOrders = orders.filter((order: any) => 
        order.metadata?.subscription_id === id
      )
      
      res.json({
        billing_history: subscriptionOrders.map((order: any) => ({
          id: order.id,
          invoice_number: `INV-${order.display_id}`,
          amount: order.total,
          currency: order.currency_code,
          status: order.payment_status || order.status,
          date: order.created_at,
        })),
        count: subscriptionOrders.length,
        limit: Number(limit),
        offset: Number(offset)
      })
    }
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-SUBSCRIPTIONS-ID-BILLING-HISTORY")}
}

