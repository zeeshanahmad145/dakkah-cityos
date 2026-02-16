// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"
import { createLogger } from "../../../lib/logger"
import { handleApiError } from "../../../lib/api-error-handler"
const logger = createLogger("api:webhooks/erpnext")

function verifyHMAC(payload: string, signature: string, secret: string): boolean {
  const computed = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
}

async function handleInventoryUpdate(data: any, correlationId: string) {
  logger.info(`[Webhook:ERPNext] inventory_update: item=${data.item_code || "unknown"}, warehouse=${data.warehouse || "unknown"}, correlation: ${correlationId}`)
}

async function handleInvoiceStatusChange(data: any, correlationId: string) {
  logger.info(`[Webhook:ERPNext] invoice_status_change: invoice=${data.name || "unknown"}, status=${data.status || "unknown"}, correlation: ${correlationId}`)
}

async function handlePaymentEntry(data: any, correlationId: string) {
  logger.info(`[Webhook:ERPNext] payment_entry: name=${data.name || "unknown"}, amount=${data.paid_amount || 0}, correlation: ${correlationId}`)
}

async function handleStockReconciliation(data: any, correlationId: string) {
  logger.info(`[Webhook:ERPNext] stock_reconciliation: name=${data.name || "unknown"}, items=${data.items?.length || 0}, correlation: ${correlationId}`)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const correlationId = crypto.randomUUID()

  if (!process.env.ERPNEXT_API_KEY || !process.env.ERPNEXT_URL_DEV) {
    return res.status(503).json({ success: false, message: "Service not configured", service: "erpnext" })
  }

  try {
    const secret = process.env.ERPNEXT_WEBHOOK_SECRET
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

    switch (event) {
      case "inventory_update":
        await handleInventoryUpdate(data, correlationId)
        break
      case "invoice_status_change":
        await handleInvoiceStatusChange(data, correlationId)
        break
      case "payment_entry":
        await handlePaymentEntry(data, correlationId)
        break
      case "stock_reconciliation":
        await handleStockReconciliation(data, correlationId)
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

