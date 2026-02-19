// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const updatePaymentMethodSchema = z.object({
  payment_method_id: z.string().min(1),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const customerId = req.auth_context?.actor_id
  
  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  try {
    const { data: subscriptions } = await query.graph({
      entity: "subscription",
      fields: ["payment_method_id", "payment_provider"],
      filters: { id, customer_id: customerId }
    })
    
    const subscription = subscriptions?.[0]
    
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" })
    }
    
    // If there's a payment method, get details from Stripe
    if (subscription.payment_method_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = require("stripe")
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        
        const paymentMethod = await stripe.paymentMethods.retrieve(
          subscription.payment_method_id
        )
        
        res.json({
          payment_method: {
            id: paymentMethod.id,
            type: paymentMethod.type,
            card: paymentMethod.card ? {
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              exp_month: paymentMethod.card.exp_month,
              exp_year: paymentMethod.card.exp_year,
              funding: paymentMethod.card.funding,
            } : null
          }
        })
      } catch (stripeError) {
        res.json({ payment_method: { id: subscription.payment_method_id } })
      }
    } else {
      res.json({ payment_method: null })
    }
  } catch (error: any) {
    handleApiError(res, error, "STORE-SUBSCRIPTIONS-ID-PAYMENT-METHOD")}
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const customerId = req.auth_context?.actor_id
  
  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const parsed = updatePaymentMethodSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  const { payment_method_id } = parsed.data
  
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const subscriptionService = req.scope.resolve("subscription")
  
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
    
    // Verify payment method belongs to customer in Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = require("stripe")
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        
        const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id)
        
        // Get customer's Stripe customer ID
        const { data: customers } = await query.graph({
          entity: "customer",
          fields: ["metadata"],
          filters: { id: customerId }
        })
        
        const customer = customers?.[0]
        const stripeCustomerId = customer?.metadata?.stripe_customer_id
        
        if (stripeCustomerId && paymentMethod.customer !== stripeCustomerId) {
          return res.status(400).json({ message: "Payment method does not belong to customer" })
        }
      } catch (stripeError: any) {
        return handleApiError(res, stripeError, "STORE-SUBSCRIPTIONS-ID-PAYMENT-METHOD")
      }
    }
    
    const updated = await subscriptionService.updateSubscriptions({
      id,
      payment_method_id,
      metadata: {
        ...subscription.metadata,
        payment_method_updated_at: new Date().toISOString(),
      }
    })
    
    res.json({ subscription: updated })
  } catch (error: any) {
    handleApiError(res, error, "STORE-SUBSCRIPTIONS-ID-PAYMENT-METHOD")}
}

