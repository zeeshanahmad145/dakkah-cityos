// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"
import { createLogger } from "../../../lib/logger"
import { handleApiError } from "../../../lib/api-error-handler"
import { appConfig } from "../../../lib/config"
const logger = createLogger("api:webhooks/fleetbase")

const FLEETBASE_STATUS_MAP: Record<string, string> = {
  dispatched: "shipped",
  in_transit: "shipped",
  out_for_delivery: "shipped",
  delivered: "delivered",
}

async function handleDeliveryStatusUpdate(payload: any, container: any) {
  const log = container.resolve("logger")
  try {
    const order_id = payload.order_id || payload.meta?.order_id
    const status = payload.status
    const tracking_number = payload.tracking_number || payload.public_id
    const estimated_delivery = payload.estimated_delivery || payload.eta

    if (!order_id) {
      log.warn("Fleetbase delivery status update missing order_id")
      return
    }

    const query = container.resolve("query") as any
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "metadata", "fulfillments.id", "fulfillments.metadata"],
      filters: { id: order_id },
    })

    if (!orders?.length) {
      const { data: ordersByMeta } = await query.graph({
        entity: "order",
        fields: ["id", "metadata", "fulfillments.id", "fulfillments.metadata"],
        filters: { metadata: { fleetbase_order_id: order_id } },
      })
      if (!ordersByMeta?.length) {
        log.info(`No matching order found for Fleetbase order_id=${order_id}`)
        return
      }
      orders.push(...ordersByMeta)
    }

    const order = orders[0]
    const medusaStatus = FLEETBASE_STATUS_MAP[status] || status

    const updatedMetadata = {
      ...(order.metadata || {}),
      fleetbase_status: status,
      fleetbase_medusa_status: medusaStatus,
      fleetbase_tracking_number: tracking_number || order.metadata?.fleetbase_tracking_number,
      fleetbase_estimated_delivery: estimated_delivery || order.metadata?.fleetbase_estimated_delivery,
      fleetbase_last_status_update: new Date().toISOString(),
    }

    if (status === "out_for_delivery") {
      updatedMetadata.fleetbase_out_for_delivery_at = new Date().toISOString()
    }

    const orderService = container.resolve("orderService") as any
    await orderService.update(order.id, { metadata: updatedMetadata })

    if (status === "delivered") {
      updatedMetadata.fleetbase_delivered_at = new Date().toISOString()
      log.info(`Order ${order.id} delivery completed via Fleetbase`)
    }

    log.info(`Fleetbase delivery status update processed: order=${order.id}, status=${status} → ${medusaStatus}`)
  } catch (error) {
    log.error("Failed to process Fleetbase delivery status update", { error: error instanceof Error ? error.message : error })
  }
}

async function handleDriverAssigned(payload: any, container: any) {
  const log = container.resolve("logger")
  try {
    const order_id = payload.order_id || payload.meta?.order_id
    const driver = payload.driver || {}
    const driver_name = driver.name || payload.driver_name || "Unknown"
    const driver_phone = driver.phone || payload.driver_phone
    const vehicle = driver.vehicle || payload.vehicle

    if (!order_id) {
      log.warn("Fleetbase driver assigned event missing order_id")
      return
    }

    const query = container.resolve("query") as any
    let order: any = null

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "metadata", "fulfillments.id", "fulfillments.metadata"],
      filters: { id: order_id },
    })

    if (orders?.length) {
      order = orders[0]
    } else {
      const { data: ordersByMeta } = await query.graph({
        entity: "order",
        fields: ["id", "metadata", "fulfillments.id", "fulfillments.metadata"],
        filters: { metadata: { fleetbase_order_id: order_id } },
      })
      order = ordersByMeta?.[0]
    }

    if (!order) {
      log.info(`No matching order found for Fleetbase driver assignment, order_id=${order_id}`)
      return
    }

    const updatedMetadata = {
      ...(order.metadata || {}),
      fleetbase_driver_name: driver_name,
      fleetbase_driver_phone: driver_phone,
      fleetbase_driver_vehicle: vehicle?.type || vehicle,
      fleetbase_driver_assigned_at: new Date().toISOString(),
    }

    const orderService = container.resolve("orderService") as any
    await orderService.update(order.id, { metadata: updatedMetadata })

    log.info(`Fleetbase driver assigned: order=${order.id}, driver=${driver_name}`)
  } catch (error) {
    log.error("Failed to process Fleetbase driver assignment", { error: error instanceof Error ? error.message : error })
  }
}

async function handleRouteUpdated(payload: any, container: any) {
  const log = container.resolve("logger")
  try {
    const order_id = payload.order_id || payload.meta?.order_id
    const new_eta = payload.eta || payload.estimated_delivery
    const route_id = payload.route_id

    if (!order_id) {
      log.warn("Fleetbase route updated event missing order_id")
      return
    }

    const query = container.resolve("query") as any
    let order: any = null

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "metadata"],
      filters: { id: order_id },
    })

    if (orders?.length) {
      order = orders[0]
    } else {
      const { data: ordersByMeta } = await query.graph({
        entity: "order",
        fields: ["id", "metadata"],
        filters: { metadata: { fleetbase_order_id: order_id } },
      })
      order = ordersByMeta?.[0]
    }

    if (!order) {
      log.info(`No matching order found for Fleetbase route update, order_id=${order_id}`)
      return
    }

    const updatedMetadata = {
      ...(order.metadata || {}),
      fleetbase_estimated_delivery: new_eta,
      fleetbase_route_id: route_id || order.metadata?.fleetbase_route_id,
      fleetbase_route_updated_at: new Date().toISOString(),
    }

    const orderService = container.resolve("orderService") as any
    await orderService.update(order.id, { metadata: updatedMetadata })

    log.info(`Fleetbase route updated: order=${order.id}, new_eta=${new_eta}, route=${route_id}`)
  } catch (error) {
    log.error("Failed to process Fleetbase route update", { error: error instanceof Error ? error.message : error })
  }
}

async function handleDeliveryCompleted(payload: any, container: any) {
  const log = container.resolve("logger")
  try {
    const order_id = payload.order_id || payload.meta?.order_id
    const proof = payload.proof || {}
    const signature_url = proof.signature || payload.signature_url
    const photo_url = proof.photo || payload.photo_url
    const completed_at = payload.completed_at || payload.delivered_at || new Date().toISOString()

    if (!order_id) {
      log.warn("Fleetbase delivery completed event missing order_id")
      return
    }

    const query = container.resolve("query") as any
    let order: any = null

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "metadata", "fulfillments.id", "fulfillments.metadata"],
      filters: { id: order_id },
    })

    if (orders?.length) {
      order = orders[0]
    } else {
      const { data: ordersByMeta } = await query.graph({
        entity: "order",
        fields: ["id", "metadata", "fulfillments.id", "fulfillments.metadata"],
        filters: { metadata: { fleetbase_order_id: order_id } },
      })
      order = ordersByMeta?.[0]
    }

    if (!order) {
      log.info(`No matching order found for Fleetbase delivery completion, order_id=${order_id}`)
      return
    }

    const updatedMetadata = {
      ...(order.metadata || {}),
      fleetbase_status: "delivered",
      fleetbase_medusa_status: "delivered",
      fleetbase_delivered_at: completed_at,
      fleetbase_delivery_proof_signature: signature_url,
      fleetbase_delivery_proof_photo: photo_url,
      fleetbase_delivery_confirmed: true,
      fleetbase_last_status_update: new Date().toISOString(),
    }

    const orderService = container.resolve("orderService") as any
    await orderService.update(order.id, { metadata: updatedMetadata })

    try {
      const { dispatchEventToTemporal } = await import("../../../lib/event-dispatcher.js")
      await dispatchEventToTemporal("fulfillment.delivery_confirmed", {
        order_id: order.id,
        completed_at,
        proof: { signature_url, photo_url },
      }, {
        source: "fleetbase-webhook",
      })
    } catch (dispatchErr) {
      log.info(`Post-delivery workflow dispatch skipped: ${dispatchErr instanceof Error ? dispatchErr.message : dispatchErr}`)
    }

    log.info(`Fleetbase delivery completed: order=${order.id}, completed_at=${completed_at}`)
  } catch (error) {
    log.error("Failed to process Fleetbase delivery completion", { error: error instanceof Error ? error.message : error })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const correlationId = crypto.randomUUID()

  if (!appConfig.fleetbase.isConfigured) {
    return res.status(503).json({ success: false, message: "Service not configured", service: "fleetbase" })
  }

  try {
    const secret = appConfig.fleetbase.webhookSecret
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

    const container = req.scope

    switch (event) {
      case "delivery_status_update":
        await handleDeliveryStatusUpdate(data, container)
        break
      case "driver_assigned":
        await handleDriverAssigned(data, container)
        break
      case "route_updated":
        await handleRouteUpdated(data, container)
        break
      case "delivery_completed":
        await handleDeliveryCompleted(data, container)
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
