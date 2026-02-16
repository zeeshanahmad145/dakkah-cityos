import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createLogger } from "../../../../lib/logger"
import { handleApiError } from "../../../../lib/api-error-handler"
const logger = createLogger("api:admin/webhooks")

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ success: false, message: "Service not configured", service: "stripe" })
  }

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    let stripeEvent: any

    if (webhookSecret) {
      const Stripe = (await import("stripe")).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "")
      const signature = req.headers["stripe-signature"] as string

      if (!signature) {
        logger.info("[Webhook:Stripe] Missing stripe-signature header")
        return res.status(401).json({ error: "Missing signature" })
      }

      try {
        const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body)
        stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
      } catch (error: any) {
        logger.info(`[Webhook:Stripe] Signature verification failed: ${error instanceof Error ? error.message : error}`)
        return handleApiError(res, error, "ADMIN-WEBHOOKS-STRIPE")}
    } else {
      stripeEvent = {
        type: (req.body as any)?.type || "unknown",
        data: (req.body as any)?.data || {},
      }
    }

    logger.info(`[Webhook:Stripe] Received event: ${stripeEvent.type}`)

    let processed = false

    switch (stripeEvent.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = stripeEvent.data.object
        const orderId = paymentIntent.metadata?.medusa_order_id || paymentIntent.metadata?.orderId
        logger.info(`[Webhook:Stripe] Payment succeeded: ${paymentIntent.id}, order: ${orderId || "N/A"}`)

        if (orderId) {
          try {
            const query = req.scope.resolve("query")
            const { data: orders } = await query.graph({
              entity: "order",
              fields: ["id", "metadata"],
              filters: { id: orderId },
            })

            if (orders && orders.length > 0) {
              const orderModuleService = req.scope.resolve("orderModuleService") as any
              await orderModuleService.updateOrders({
                id: orderId,
                metadata: {
                  ...orders[0].metadata,
                  stripe_payment_intent_id: paymentIntent.id,
                  stripe_payment_status: "succeeded",
                  stripe_paid_at: new Date().toISOString(),
                },
              })
            }
          } catch (error: any) {
            logger.error(`[Webhook:Stripe] updating order payment status: ${error instanceof Error ? error.message : error}`)}

          try {
            const { dispatchEventToTemporal } = await import("../../../../lib/event-dispatcher.js")
            await dispatchEventToTemporal("invoice.created", {
              order_id: orderId,
              payment_intent_id: paymentIntent.id,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              tenant_id: paymentIntent.metadata?.tenantId,
            }, {
              tenantId: paymentIntent.metadata?.tenantId,
              source: "stripe-webhook",
            })
            logger.info(`[Webhook:Stripe] Dispatched invoice creation to Temporal for order ${orderId}`)
          } catch (error: any) {
            logger.error(`[Webhook:Stripe] dispatching invoice creation: ${error instanceof Error ? error.message : error}`)}
        }
        processed = true
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = stripeEvent.data.object
        const orderId = paymentIntent.metadata?.medusa_order_id || paymentIntent.metadata?.orderId
        logger.info(`[Webhook:Stripe] Payment failed: ${paymentIntent.id}, order: ${orderId || "N/A"}`)

        if (orderId) {
          try {
            const query = req.scope.resolve("query")
            const { data: orders } = await query.graph({
              entity: "order",
              fields: ["id", "metadata"],
              filters: { id: orderId },
            })

            if (orders && orders.length > 0) {
              const orderModuleService = req.scope.resolve("orderModuleService") as any
              await orderModuleService.updateOrders({
                id: orderId,
                metadata: {
                  ...orders[0].metadata,
                  stripe_payment_status: "failed",
                  stripe_payment_failed_at: new Date().toISOString(),
                  stripe_failure_message: paymentIntent.last_payment_error?.message || "Unknown error",
                },
              })
            }
          } catch (error: any) {
            logger.error(`[Webhook:Stripe] updating failed payment status: ${error instanceof Error ? error.message : error}`)}
        }
        processed = true
        break
      }

      case "charge.refunded": {
        const charge = stripeEvent.data.object
        const orderId = charge.metadata?.medusa_order_id || charge.metadata?.orderId
        logger.info(`[Webhook:Stripe] Charge refunded: ${charge.id}, order: ${orderId || "N/A"}`)

        if (orderId) {
          try {
            const query = req.scope.resolve("query")
            const { data: orders } = await query.graph({
              entity: "order",
              fields: ["id", "metadata"],
              filters: { id: orderId },
            })

            if (orders && orders.length > 0) {
              const orderModuleService = req.scope.resolve("orderModuleService") as any
              await orderModuleService.updateOrders({
                id: orderId,
                metadata: {
                  ...orders[0].metadata,
                  stripe_refund_status: charge.refunded ? "fully_refunded" : "partially_refunded",
                  stripe_amount_refunded: charge.amount_refunded,
                  stripe_refunded_at: new Date().toISOString(),
                },
              })
            }
          } catch (error: any) {
            logger.error(`[Webhook:Stripe] updating refund status: ${error instanceof Error ? error.message : error}`)}
        }
        processed = true
        break
      }

      case "account.updated": {
        const account = stripeEvent.data.object
        const tenantId = account.metadata?.tenantId
        logger.info(`[Webhook:Stripe] Connect account updated: ${account.id}, tenant: ${tenantId || "N/A"}`)
        logger.info(`[Webhook:Stripe] Account charges_enabled: ${account.charges_enabled}, payouts_enabled: ${account.payouts_enabled}`)

        if (tenantId) {
          try {
            const query = req.scope.resolve("query")
            const { data: vendors } = await query.graph({
              entity: "vendor",
              fields: ["id", "metadata"],
              filters: { metadata: { stripe_account_id: account.id } },
            })

            if (vendors && vendors.length > 0) {
              const vendorModuleService = req.scope.resolve("vendorModuleService") as any
              await vendorModuleService.updateVendors({
                id: vendors[0].id,
                metadata: {
                  ...vendors[0].metadata,
                  stripe_account_id: account.id,
                  stripe_charges_enabled: account.charges_enabled,
                  stripe_payouts_enabled: account.payouts_enabled,
                  stripe_account_status: account.charges_enabled ? "active" : "pending",
                  stripe_account_updated_at: new Date().toISOString(),
                },
              })
              logger.info(`[Webhook:Stripe] Vendor ${vendors[0].id} Stripe account status updated`)
            }
          } catch (error: any) {
            logger.error(`[Webhook:Stripe] updating vendor Stripe status: ${error instanceof Error ? error.message : error}`)}
        }
        processed = true
        break
      }

      case "checkout.session.completed": {
        const session = stripeEvent.data.object
        logger.info(`[Webhook:Stripe] Checkout session completed: ${session.id}, payment_status: ${session.payment_status}`)
        processed = true
        break
      }

      default:
        logger.info(`[Webhook:Stripe] Unhandled event type: ${stripeEvent.type}`)
        break
    }

    return res.status(200).json({ received: true, type: stripeEvent.type, processed })
  } catch (error: any) {
    logger.error(`[Webhook:Stripe] ${error instanceof Error ? error.message : error}`)
    return handleApiError(res, error, "ADMIN-WEBHOOKS-STRIPE")}
}

