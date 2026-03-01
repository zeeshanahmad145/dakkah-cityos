// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import { apiLogger } from "../../../../../lib/logger"
import { formatZodErrors } from "../../../../../lib/validation"
import { handleApiError } from "../../../../../lib/api-error-handler"

const logger = apiLogger

const changePlanSchema = z.object({
  plan_id: z.string().min(1, "plan_id is required"),
  prorate: z.boolean().default(true),
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const customerId = req.auth_context?.actor_id
  
  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  
  const parseResult = changePlanSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: formatZodErrors(parseResult.error)
    })
  }
  
  const { plan_id, prorate } = parseResult.data
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any
  const subscriptionService = req.scope.resolve("subscription") as unknown as any
  
  try {
    // Get current subscription
    const { data: subscriptions } = await query.graph({
      entity: "subscription",
      fields: ["*", "plan.*"],
      filters: { id, customer_id: customerId }
    })
    
    const subscription = subscriptions?.[0]
    
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" })
    }
    
    if (!["active", "trialing"].includes(subscription.status)) {
      return res.status(400).json({ message: "Can only change plan for active subscriptions" })
    }
    
    // Get new plan
    const { data: plans } = await query.graph({
      entity: "subscription_plan",
      fields: ["*"],
      filters: { id: plan_id }
    })
    
    const newPlan = plans?.[0]
    
    if (!newPlan) {
      return res.status(404).json({ message: "Plan not found" })
    }
    
    if (!newPlan.is_active) {
      return res.status(400).json({ message: "Selected plan is not available" })
    }
    
    // Calculate proration if upgrading/downgrading
    let proratedAmount = 0
    let proratedCredit = 0
    
    if (prorate && subscription.plan) {
      const currentPlan = subscription.plan as { price: number }
      const nextBillingDate = new Date(subscription.next_billing_date as string)
      const now = new Date()
      
      // Calculate days remaining in current period
      const daysRemaining = Math.max(0, Math.ceil(
        (nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ))
      
      // Determine billing period days
      const billingPeriodDays = subscription.billing_interval === "month" ? 30 : 
                               subscription.billing_interval === "year" ? 365 : 
                               subscription.billing_interval === "quarter" ? 90 : 30
      
      const currentDailyRate = Number(currentPlan.price) / billingPeriodDays
      const newDailyRate = Number(newPlan.price) / billingPeriodDays
      
      // Calculate difference
      const difference = (newDailyRate - currentDailyRate) * daysRemaining
      
      if (difference > 0) {
        // Upgrade - charge the difference
        proratedAmount = Math.round(difference * 100) / 100
      } else {
        // Downgrade - credit the difference
        proratedCredit = Math.abs(Math.round(difference * 100) / 100)
      }
    }
    
    const updated = await subscriptionService.updateSubscriptions({
      id,
      plan_id: newPlan.id,
      price: newPlan.price,
      metadata: {
        ...(subscription.metadata as Record<string, unknown> || {}),
        previous_plan_id: subscription.plan_id,
        plan_changed_at: new Date().toISOString(),
        prorated_amount: proratedAmount,
        prorated_credit: proratedCredit,
        proration_applied: prorate,
      }
    })
    
    const eventBus = req.scope.resolve("event_bus") as unknown as any
    await eventBus.emit("subscription.plan_changed", { 
      id, 
      customer_id: customerId,
      old_plan_id: subscription.plan_id,
      new_plan_id: newPlan.id,
      prorated_amount: proratedAmount,
      prorated_credit: proratedCredit,
    })
    
    logger.info("Subscription plan changed", { 
      subscriptionId: id, 
      customerId,
      oldPlanId: subscription.plan_id,
      newPlanId: newPlan.id 
    })
    
    res.json({ 
      subscription: updated,
      proration: {
        applied: prorate,
        amount_due: proratedAmount,
        credit: proratedCredit,
      }
    })
  } catch (error: unknown) {
    logger.error("Failed to change subscription plan", error, { subscriptionId: id })
    handleApiError(res, error, "STORE-SUBSCRIPTIONS-ID-CHANGE-PLAN")}
}

