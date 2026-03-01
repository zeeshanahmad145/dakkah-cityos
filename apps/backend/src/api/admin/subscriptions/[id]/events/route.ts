// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../../lib/api-error-handler"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as unknown as any
    const { id } = req.params
  
    // Get subscription
    const { data: [subscription] } = await query.graph({
      entity: "subscription",
      fields: ["*", "invoices.*"],
      filters: { id },
    })
  
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" })
    }
  
    // Build event timeline from subscription data and metadata
    const events: Array<{
      id: string
      type: string
      description: string
      timestamp: string
      metadata?: any
    }> = []
  
    // Created event
    events.push({
      id: `${id}_created`,
      type: "subscription.created",
      description: "Subscription created",
      timestamp: subscription.created_at,
    })
  
    // Status change events from metadata
    const metadata = subscription.metadata || {}
  
    if (metadata.plan_changed_at) {
      events.push({
        id: `${id}_plan_changed_${metadata.plan_changed_at}`,
        type: "subscription.plan_changed",
        description: `Plan changed by ${metadata.plan_changed_by || "system"}`,
        timestamp: metadata.plan_changed_at,
        metadata: { previous_plan_id: metadata.previous_plan_id },
      })
    }
  
    if (subscription.paused_at) {
      events.push({
        id: `${id}_paused`,
        type: "subscription.paused",
        description: metadata.pause_reason || "Subscription paused",
        timestamp: subscription.paused_at,
      })
    }
  
    if (metadata.resumed_at) {
      events.push({
        id: `${id}_resumed`,
        type: "subscription.resumed",
        description: `Subscription resumed by ${metadata.resumed_by || "system"}`,
        timestamp: metadata.resumed_at,
      })
    }
  
    if (subscription.cancelled_at) {
      events.push({
        id: `${id}_cancelled`,
        type: "subscription.cancelled",
        description: subscription.cancellation_reason || "Subscription cancelled",
        timestamp: subscription.cancelled_at,
      })
    }
  
    // Add invoice events
    if (subscription.invoices) {
      subscription.invoices.forEach((invoice: any) => {
        events.push({
          id: `invoice_${invoice.id}`,
          type: `invoice.${invoice.status}`,
          description: `Invoice ${invoice.invoice_number || invoice.id} - ${invoice.status}`,
          timestamp: invoice.created_at,
          metadata: { amount: invoice.total, invoice_id: invoice.id },
        })
      })
    }
  
    // Sort by timestamp descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  
    res.json({ events })

  } catch (error: unknown) {
    handleApiError(res, error, "GET admin subscriptions id events")}
}

