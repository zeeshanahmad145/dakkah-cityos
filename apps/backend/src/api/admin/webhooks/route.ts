import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"
import { appConfig } from "../../../lib/config"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const endpoints = [
    {
      system: "payload",
      path: "/admin/webhooks/payload",
      description: "Payload CMS content sync webhooks",
      events: [
        "product.published",
        "product.updated",
        "page.published",
        "media.uploaded",
        "tenant.updated",
        "store.updated",
      ],
      configured: !!appConfig.payloadCms.webhookSecret,
      required_env_vars: ["PAYLOAD_WEBHOOK_SECRET"],
    },
    {
      system: "erpnext",
      path: "/admin/webhooks/erpnext",
      description: "ERPNext ERP system webhooks",
      events: [
        "Sales Invoice:on_submit",
        "Sales Invoice:on_cancel",
        "Payment Entry:on_submit",
        "Stock Entry:on_submit",
        "Customer:on_update",
      ],
      configured: !!appConfig.erpnext.webhookSecret,
      required_env_vars: ["ERPNEXT_WEBHOOK_SECRET"],
    },
    {
      system: "fleetbase",
      path: "/admin/webhooks/fleetbase",
      description: "Fleetbase logistics and delivery webhooks",
      events: [
        "order.status_changed",
        "order.completed",
        "order.driver_assigned",
        "tracking.updated",
      ],
      configured: !!appConfig.fleetbase.webhookSecret,
      required_env_vars: ["FLEETBASE_WEBHOOK_SECRET"],
    },
    {
      system: "stripe",
      path: "/admin/webhooks/stripe",
      description: "Stripe payment webhooks",
      events: [
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
        "charge.refunded",
        "account.updated",
        "checkout.session.completed",
      ],
      configured: !!appConfig.stripe.webhookSecret,
      required_env_vars: ["STRIPE_WEBHOOK_SECRET"],
    },
  ]

  return res.json({
    webhooks: endpoints,
    total: endpoints.length,
    configured_count: endpoints.filter((e) => e.configured).length,
  })
}

