// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"
import { createLogger } from "../../../lib/logger"
import { handleApiError } from "../../../lib/api-error-handler"
const logger = createLogger("api:webhooks/fleetbase")

async function handleDeliveryStatusUpdate(data: any, correlationId: string) {
  logger.info(`[Webhook:Fleetbase] delivery_status_update: order=${data.order_id || "unknown"}, status=${data.status || "unknown"}, correlation: ${correlationId}`)
}

async function handleDriverAssigned(data: any, correlationId: string) {
  const driverName = data.driver?.name || data.driver_name || "unknown"
  logger.info(`[Webhook:Fleetbase] driver_assigned: order=${data.order_id || "unknown"}, driver=${driverName}, correlation: ${correlationId}`)
}

async function handleRouteUpdated(data: any, correlationId: string) {
  logger.info(`[Webhook:Fleetbase] route_updated: route=${data.route_id || "unknown"}, eta=${data.eta || "unknown"}, correlation: ${correlationId}`)
}

async function handleDeliveryCompleted(data: any, correlationId: string) {
  logger.info(`[Webhook:Fleetbase] delivery_completed: order=${data.order_id || "unknown"}, correlation: ${correlationId}`)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const correlationId = crypto.randomUUID()

  if (!process.env.FLEETBASE_API_KEY && !process.env.FLEETBASE_URL_DEV) {
    return res.status(503).json({ success: false, message: "Service not configured", service: "fleetbase" })
  }

  try {
    const secret = process.env.FLEETBASE_WEBHOOK_SECRET
    if (secret) {
      const apiKey = req.headers["x-fleetbase-key"] as string || req.headers["x-fleetbase-signature"] as string
      if (!apiKey) {
        logger.info(`[Webhook:Fleetbase] Missing API key header (correlation: ${correlationId})`)
        return res.status(400).json({ error: "Missing API key" })
      }

      if (apiKey !== secret) {
        logger.info(`[Webhook:Fleetbase] Invalid API key (correlation: ${correlationId})`)
        return res.status(400).json({ error: "Invalid API key" })
      }
    }

    const body = req.body as Record<string, any>
    const event = body.event || "unknown"
    const data = body.data || body

    logger.info(`[Webhook:Fleetbase] Received event: ${event} (correlation: ${correlationId})`)

    switch (event) {
      case "delivery_status_update":
        await handleDeliveryStatusUpdate(data, correlationId)
        break
      case "driver_assigned":
        await handleDriverAssigned(data, correlationId)
        break
      case "route_updated":
        await handleRouteUpdated(data, correlationId)
        break
      case "delivery_completed":
        await handleDeliveryCompleted(data, correlationId)
        break
      default:
        logger.info(`[Webhook:Fleetbase] Unhandled event: ${event} (correlation: ${correlationId})`)
        break
    }

    try {
      const { dispatchEventToTemporal } = await import("../../../lib/event-dispatcher.js")
      await dispatchEventToTemporal(`fulfillment.${event}`, data, {
        correlationId,
        source: "fleetbase-webhook",
      })
    } catch (error: any) {
      logger.info(`[Webhook:Fleetbase] Temporal dispatch skipped: ${error.message}`)
    }

    return res.status(200).json({ received: true, event, correlation_id: correlationId })
  } catch (error: any) {
    return handleApiError(res, error, "WEBHOOKS-FLEETBASE")}
}

