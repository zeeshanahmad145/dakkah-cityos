// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const pauseSubscriptionSchema = z.object({
  reason: z.string().optional(),
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const customerId = req.auth_context?.actor_id
  
  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const subscriptionService = req.scope.resolve("subscription")
  
  const parsed = pauseSubscriptionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  try {
    // Verify ownership
    const { data: subscriptions } = await query.graph({
      entity: "subscription",
      fields: ["*"],
      filters: { id, customer_id: customerId }
    })
    
    const subscription = subscriptions?.[0]
    
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" })
    }
    
    if (subscription.status !== "active") {
      return res.status(400).json({ message: "Only active subscriptions can be paused" })
    }
    
    const updated = await subscriptionService.updateSubscriptions({
      id,
      status: "paused",
      paused_at: new Date(),
      metadata: {
        ...subscription.metadata,
        pause_reason: parsed.data.reason || "customer_requested",
        paused_by: customerId,
      }
    })
    
    // Emit event for notifications
    const eventBus = req.scope.resolve("event_bus")
    await eventBus.emit("subscription.paused", { 
      id, 
      customer_id: customerId,
      reason: parsed.data.reason 
    })
    
    res.json({ subscription: updated })
  } catch (error: any) {
    handleApiError(res, error, "STORE-SUBSCRIPTIONS-ID-PAUSE")}
}

