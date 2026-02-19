// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

// No required body fields for resume; reason/metadata accepted via passthrough
const resumeSubscriptionSchema = z.object({
  reason: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const customerId = req.auth_context?.actor_id
  
  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const subscriptionService = req.scope.resolve("subscription")
  
  const parsed = resumeSubscriptionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  try {
    const { data: subscriptions } = await query.graph({
      entity: "subscription",
      fields: ["*"],
      filters: { id, customer_id: customerId }
    })
    
    const subscription = subscriptions?.[0]
    
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" })
    }
    
    if (subscription.status !== "paused") {
      return res.status(400).json({ message: "Only paused subscriptions can be resumed" })
    }
    
    // Calculate new billing date (extend by pause duration)
    const pausedAt = new Date(subscription.paused_at)
    const pauseDuration = Date.now() - pausedAt.getTime()
    const currentNextBilling = new Date(subscription.next_billing_date)
    const newNextBillingDate = new Date(currentNextBilling.getTime() + pauseDuration)
    
    const updated = await subscriptionService.updateSubscriptions({
      id,
      status: "active",
      paused_at: null,
      next_billing_date: newNextBillingDate,
      metadata: {
        ...subscription.metadata,
        resumed_at: new Date().toISOString(),
        total_pause_duration_ms: pauseDuration,
      }
    })
    
    const eventBus = req.scope.resolve("event_bus")
    await eventBus.emit("subscription.resumed", { 
      id, 
      customer_id: customerId,
      new_billing_date: newNextBillingDate 
    })
    
    res.json({ subscription: updated })
  } catch (error: any) {
    handleApiError(res, error, "STORE-SUBSCRIPTIONS-ID-RESUME")}
}

