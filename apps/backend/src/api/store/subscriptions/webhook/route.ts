// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

// POST - Handle Stripe subscription webhooks
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeSecretKey) {
    return res.status(503).json({ success: false, message: "Service not configured", service: "stripe" })
  }

  const stripe = require("stripe")(stripeSecretKey)
  const sig = req.headers["stripe-signature"]

  let event

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    } else {
      event = req.body
    }
  } catch (error: any) {
    return handleApiError(res, error, "STORE-SUBSCRIPTIONS-WEBHOOK")}

  const subscriptionService = req.scope.resolve("subscriptionModuleService")

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        if (session.mode === "subscription") {
          const customerId = session.metadata?.medusa_customer_id
          const planId = session.metadata?.medusa_plan_id
          const stripeSubscriptionId = session.subscription

          if (customerId && planId) {
            // Create subscription in Medusa
            await subscriptionService.createSubscriptions({
              customer_id: customerId,
              plan_id: planId,
              status: "active",
              stripe_subscription_id: stripeSubscriptionId,
              current_period_start: new Date(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            })
          }
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object
        const stripeSubscriptionId = invoice.subscription

        if (stripeSubscriptionId) {
          // Find and update subscription
          const { data: subscriptions } = await subscriptionService.listSubscriptions({
            stripe_subscription_id: stripeSubscriptionId
          })

          if (subscriptions.length) {
            await subscriptionService.updateSubscriptions({
              selector: { id: subscriptions[0].id },
              data: {
                status: "active",
                last_payment_date: new Date(),
                current_period_end: new Date(invoice.lines.data[0]?.period?.end * 1000)
              }
            })
          }
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object
        const stripeSubscriptionId = invoice.subscription

        if (stripeSubscriptionId) {
          const { data: subscriptions } = await subscriptionService.listSubscriptions({
            stripe_subscription_id: stripeSubscriptionId
          })

          if (subscriptions.length) {
            await subscriptionService.updateSubscriptions({
              selector: { id: subscriptions[0].id },
              data: {
                status: "past_due",
                payment_failed_at: new Date()
              }
            })
          }
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object
        const stripeSubscriptionId = subscription.id

        const { data: subscriptions } = await subscriptionService.listSubscriptions({
          stripe_subscription_id: stripeSubscriptionId
        })

        if (subscriptions.length) {
          await subscriptionService.updateSubscriptions({
            selector: { id: subscriptions[0].id },
            data: {
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000)
            }
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object
        const stripeSubscriptionId = subscription.id

        const { data: subscriptions } = await subscriptionService.listSubscriptions({
          stripe_subscription_id: stripeSubscriptionId
        })

        if (subscriptions.length) {
          await subscriptionService.updateSubscriptions({
            selector: { id: subscriptions[0].id },
            data: {
              status: "cancelled",
              cancelled_at: new Date()
            }
          })
        }
        break
      }
    }

    res.json({ received: true })
  } catch (error: any) {
    handleApiError(res, error, "STORE-SUBSCRIPTIONS-WEBHOOK")}
}

