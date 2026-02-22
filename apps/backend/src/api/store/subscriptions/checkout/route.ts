import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const checkoutSchema = z.object({
  plan_id: z.string().min(1),
  success_url: z.string().min(1),
  cancel_url: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// POST - Create Stripe Checkout session for subscription
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const customerId = (req as any).auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const parsed = checkoutSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  const { plan_id, success_url, cancel_url, metadata } = parsed.data

  const query = req.scope.resolve("query")

  // Get plan details
  const { data: plans } = await query.graph({
    entity: "subscription_plan",
    fields: ["id", "name", "price", "currency", "interval", "interval_count", "stripe_price_id"],
    filters: { id: plan_id }
  })

  if (!plans.length) {
    return res.status(404).json({ message: "Plan not found" })
  }

  const plan = plans[0]

  // Get customer details using authenticated customer ID (prevents IDOR)
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "last_name"],
    filters: { id: customerId }
  })

  if (!customers.length) {
    return res.status(404).json({ message: "Customer not found" })
  }

  const customer = customers[0]

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    return res.status(400).json({ 
      message: "Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables." 
    })
  }

  try {
    const stripe = require("stripe")(stripeSecretKey)

    // Create or get Stripe price
    let stripePriceId = plan.stripe_price_id

    if (!stripePriceId) {
      // Create product and price in Stripe
      const product = await stripe.products.create({
        name: plan.name,
        metadata: { medusa_plan_id: plan.id }
      })

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(plan.price * 100), // Convert to cents
        currency: plan.currency || "usd",
        recurring: {
          interval: plan.interval || "month",
          interval_count: plan.interval_count || 1
        }
      })

      stripePriceId = price.id

      // Save Stripe price ID to plan (would need to add this to subscription module)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: customer.email,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: success_url || `${process.env.STORE_URL}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.STORE_URL}/subscriptions/cancel`,
      metadata: {
        medusa_customer_id: customerId,
        medusa_plan_id: plan_id,
        ...metadata
      },
      subscription_data: {
        metadata: {
          medusa_customer_id: customerId,
          medusa_plan_id: plan_id
        }
      }
    })

    res.json({
      checkout_url: session.url,
      session_id: session.id
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-SUBSCRIPTIONS-CHECKOUT")}
}

