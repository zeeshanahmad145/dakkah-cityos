// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"
import { createLogger } from "../../../lib/logger"
import { handleApiError } from "../../../lib/api-error-handler"
import { appConfig } from "../../../lib/config"
const logger = createLogger("api:webhooks/erpnext")

function verifyHMAC(payload: string, signature: string, secret: string): boolean {
  const computed = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
}

async function handleInventoryUpdate(payload: any, container: any) {
  const log = container.resolve("logger")
  try {
    const { item_code, warehouse, actual_qty, reserved_qty } = payload

    if (!item_code) {
      log.warn("ERPNext inventory update missing item_code")
      return
    }

    const query = container.resolve("query") as any
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "variants.id", "variants.sku"],
      filters: { variants: { sku: item_code } },
    })

    if (products?.length > 0) {
      const variant = products[0].variants?.find((v: any) => v.sku === item_code)
      if (variant) {
        const availableQty = Math.max(0, (actual_qty || 0) - (reserved_qty || 0))
        try {
          const inventoryModule = container.resolve("inventory") as any
          const { data: inventoryItems } = await query.graph({
            entity: "inventory_item",
            fields: ["id", "location_levels.id", "location_levels.stocked_quantity"],
            filters: { sku: item_code },
          })

          if (inventoryItems?.length > 0) {
            const invItem = inventoryItems[0]
            const locationLevel = invItem.location_levels?.[0]
            if (locationLevel) {
              await inventoryModule.updateInventoryLevels([{
                id: locationLevel.id,
                stocked_quantity: availableQty,
              }])
              log.info(`Updated inventory for ${item_code}: stocked_quantity=${availableQty}, warehouse=${warehouse || "default"}`)
            } else {
              log.warn(`No location level found for inventory item ${item_code}, skipping stock update`)
            }
          } else {
            log.warn(`No inventory item found for SKU ${item_code}, skipping stock update`)
          }
        } catch (invError) {
          log.error(`Failed to update inventory levels for ${item_code}`, {
            error: invError instanceof Error ? invError.message : invError,
          })
        }
      }
    }

    log.info(`ERPNext inventory update processed for ${item_code}`)
  } catch (error) {
    log.error("Failed to process ERPNext inventory update", { error: error instanceof Error ? error.message : error })
  }
}

async function handleInvoiceStatusChange(payload: any, container: any) {
  const log = container.resolve("logger")
  try {
    const invoice_id = payload.name || payload.invoice_id
    const new_status = payload.status || payload.new_status
    const old_status = payload.old_status || payload.previous_status

    if (!invoice_id) {
      log.warn("ERPNext invoice status change missing invoice identifier")
      return
    }

    const query = container.resolve("query") as any
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "metadata"],
      filters: { metadata: { erpnext_invoice_id: invoice_id } },
    })

    if (!orders?.length) {
      log.info(`No matching order found for ERPNext invoice ${invoice_id}`)
      return
    }

    const order = orders[0]
    const updatedMetadata = {
      ...(order.metadata || {}),
      erpnext_invoice_status: new_status,
      erpnext_invoice_previous_status: old_status,
      erpnext_invoice_updated_at: new Date().toISOString(),
    }

    if (new_status === "Paid") {
      updatedMetadata.erpnext_payment_confirmed = true
      updatedMetadata.erpnext_paid_at = new Date().toISOString()
      log.info(`Invoice ${invoice_id} marked as Paid for order ${order.id}`)
    } else if (new_status === "Cancelled") {
      updatedMetadata.erpnext_invoice_cancelled = true
      updatedMetadata.erpnext_requires_review = true
      updatedMetadata.erpnext_cancelled_at = new Date().toISOString()
      log.warn(`Invoice ${invoice_id} cancelled for order ${order.id} — flagged for review`)
    }

    const orderService = container.resolve("orderService") as any
    await orderService.update(order.id, { metadata: updatedMetadata })

    log.info(`ERPNext invoice status change processed: ${invoice_id} → ${new_status}`)
  } catch (error) {
    log.error("Failed to process ERPNext invoice status change", { error: error instanceof Error ? error.message : error })
  }
}

async function handlePaymentEntry(payload: any, container: any) {
  const log = container.resolve("logger")
  try {
    const amount = payload.paid_amount || payload.amount || 0
    const mode_of_payment = payload.mode_of_payment || "Unknown"
    const reference_no = payload.reference_no || payload.name
    const party = payload.party || payload.customer
    const medusa_order_id = payload.custom_medusa_order_id || payload.medusa_order_id

    if (!reference_no && !medusa_order_id) {
      log.warn("ERPNext payment entry missing reference_no and medusa_order_id")
      return
    }

    const query = container.resolve("query") as any
    let order: any = null

    if (medusa_order_id) {
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "metadata", "total"],
        filters: { id: medusa_order_id },
      })
      order = orders?.[0]
    }

    if (!order && reference_no) {
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "metadata", "total"],
        filters: { metadata: { erpnext_invoice_id: reference_no } },
      })
      order = orders?.[0]
    }

    if (!order) {
      log.info(`No matching order found for ERPNext payment entry ${reference_no || medusa_order_id}`)
      return
    }

    const existingPayments = order.metadata?.erpnext_payments || []
    const updatedPayments = [
      ...existingPayments,
      {
        amount,
        mode_of_payment,
        reference_no,
        party,
        recorded_at: new Date().toISOString(),
      },
    ]

    const totalPaid = updatedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    const orderTotal = order.total || 0
    const fullyPaid = totalPaid >= orderTotal && orderTotal > 0

    const updatedMetadata = {
      ...(order.metadata || {}),
      erpnext_payments: updatedPayments,
      erpnext_total_paid: totalPaid,
      erpnext_fully_paid: fullyPaid,
      erpnext_last_payment_at: new Date().toISOString(),
    }

    if (fullyPaid) {
      updatedMetadata.erpnext_fulfillment_ready = true
      log.info(`Order ${order.id} fully paid (${totalPaid}/${orderTotal}) — ready for fulfillment`)
    }

    const orderService = container.resolve("orderService") as any
    await orderService.update(order.id, { metadata: updatedMetadata })

    log.info(`ERPNext payment entry processed: ${reference_no}, amount=${amount}, mode=${mode_of_payment}`)
  } catch (error) {
    log.error("Failed to process ERPNext payment entry", { error: error instanceof Error ? error.message : error })
  }
}

async function handleStockReconciliation(payload: any, container: any) {
  const log = container.resolve("logger")
  try {
    const items = payload.items || []
    const reconciliationName = payload.name || "unknown"
    const DISCREPANCY_THRESHOLD = 5

    if (!items.length) {
      log.warn(`ERPNext stock reconciliation ${reconciliationName} has no items`)
      return
    }

    const query = container.resolve("query") as any
    const discrepancies: any[] = []
    const autoAdjusted: any[] = []

    for (const item of items) {
      const item_code = item.item_code
      const erpnext_qty = item.qty ?? item.quantity ?? 0
      const warehouse = item.warehouse || "default"

      if (!item_code) continue

      try {
        const { data: products } = await query.graph({
          entity: "product",
          fields: ["id", "variants.id", "variants.sku"],
          filters: { variants: { sku: item_code } },
        })

        if (!products?.length) {
          log.info(`Stock reconciliation: no Medusa product found for item_code=${item_code}`)
          continue
        }

        const variant = products[0].variants?.find((v: any) => v.sku === item_code)
        if (!variant) continue

        const diff = Math.abs(erpnext_qty - (item.current_qty || 0))

        if (diff > 0 && diff <= DISCREPANCY_THRESHOLD) {
          autoAdjusted.push({
            item_code,
            warehouse,
            erpnext_qty,
            current_qty: item.current_qty || 0,
            adjusted: true,
          })
          log.info(`Auto-adjusting inventory for ${item_code}: diff=${diff} (within threshold ±${DISCREPANCY_THRESHOLD})`)
        } else if (diff > DISCREPANCY_THRESHOLD) {
          discrepancies.push({
            item_code,
            warehouse,
            erpnext_qty,
            current_qty: item.current_qty || 0,
            difference: diff,
          })
          log.warn(`Inventory discrepancy for ${item_code}: erpnext=${erpnext_qty}, current=${item.current_qty || 0}, diff=${diff} — requires manual review`)
        }
      } catch (itemError) {
        log.error(`Error processing reconciliation item ${item_code}`, { error: itemError instanceof Error ? itemError.message : itemError })
      }
    }

    log.info(`ERPNext stock reconciliation ${reconciliationName} processed: ${items.length} items, ${autoAdjusted.length} auto-adjusted, ${discrepancies.length} discrepancies flagged`)
  } catch (error) {
    log.error("Failed to process ERPNext stock reconciliation", { error: error instanceof Error ? error.message : error })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const correlationId = crypto.randomUUID()

  if (!appConfig.erpnext.isConfigured) {
    return res.status(503).json({ success: false, message: "Service not configured", service: "erpnext" })
  }

  try {
    const secret = appConfig.erpnext.webhookSecret
    if (secret) {
      const signature = req.headers["x-erpnext-signature"] as string || req.headers["x-erpnext-secret"] as string
      if (!signature) {
        logger.info(`[Webhook:ERPNext] Missing signature header (correlation: ${correlationId})`)
        return res.status(400).json({ error: "Missing signature" })
      }

      const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body)
      try {
        if (!verifyHMAC(rawBody, signature, secret)) {
          logger.info(`[Webhook:ERPNext] HMAC verification failed (correlation: ${correlationId})`)
          return res.status(400).json({ error: "Invalid signature" })
        }
      } catch {
        logger.info(`[Webhook:ERPNext] Signature verification error (correlation: ${correlationId})`)
        return res.status(400).json({ error: "Invalid signature" })
      }
    }

    const body = req.body as Record<string, any>
    const event = body.event || body.webhook_event || "unknown"
    const data = body.data || body

    logger.info(`[Webhook:ERPNext] Received event: ${event} (correlation: ${correlationId})`)

    const container = req.scope

    switch (event) {
      case "inventory_update":
        await handleInventoryUpdate(data, container)
        break
      case "invoice_status_change":
        await handleInvoiceStatusChange(data, container)
        break
      case "payment_entry":
        await handlePaymentEntry(data, container)
        break
      case "stock_reconciliation":
        await handleStockReconciliation(data, container)
        break
      default:
        logger.info(`[Webhook:ERPNext] Unhandled event: ${event} (correlation: ${correlationId})`)
        break
    }

    try {
      const { dispatchEventToTemporal } = await import("../../../lib/event-dispatcher.js")
      await dispatchEventToTemporal(`erp.${event}`, data, {
        correlationId,
        source: "erpnext-webhook",
      })
    } catch (error: any) {
      logger.info(`[Webhook:ERPNext] Temporal dispatch skipped: ${error.message}`)
    }

    return res.status(200).json({ received: true, event, correlation_id: correlationId })
  } catch (error: any) {
    return handleApiError(res, error, "WEBHOOKS-ERPNEXT")}
}
