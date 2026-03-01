// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"
import { createLogger } from "../../../lib/logger"
import { handleApiError } from "../../../lib/api-error-handler"
import { appConfig } from "../../../lib/config"
const logger = createLogger("api:webhooks/payload-cms")

const SUPPORTED_COLLECTIONS = [
  "tenants",
  "stores",
  "scopes",
  "categories",
  "subcategories",
  "portals",
  "governance-authorities",
  "policies",
  "personas",
  "persona-assignments",
  "countries",
  "compliance-records",
  "nodes",
] as const

const HIERARCHY_COLLECTIONS = [
  "countries",
  "governance-authorities",
  "scopes",
  "categories",
  "subcategories",
  "tenants",
  "stores",
  "portals",
] as const

const CONTENT_COLLECTIONS = [
  "policies",
  "personas",
  "persona-assignments",
  "compliance-records",
  "nodes",
] as const

type SupportedCollection = (typeof SUPPORTED_COLLECTIONS)[number]

function verifyPayloadSignature(payload: string, signature: string, secret: string): boolean {
  const computed = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
  } catch {
    return false
  }
}

function isHierarchyCollection(collection: string): boolean {
  return (HIERARCHY_COLLECTIONS as readonly string[]).includes(collection)
}

function isContentCollection(collection: string): boolean {
  return (CONTENT_COLLECTIONS as readonly string[]).includes(collection)
}

async function handleHierarchySync(collection: string, data: any, correlationId: string, req: MedusaRequest) {
  const docId = data.id || data.doc?.id
  logger.info(`[Webhook:PayloadCMS] Hierarchy sync for ${collection}, doc=${docId}, correlation: ${correlationId}`)

  try {
    const { createHierarchySyncEngine } = require("../../../integrations/cms-hierarchy-sync/engine")
    const engine = createHierarchySyncEngine()
    if (!engine) {
      logger.info(`[Webhook:PayloadCMS] CMS sync engine not available (services not configured), skipping hierarchy sync, correlation: ${correlationId}`)
      return
    }
    const result = await engine.syncCollection(collection)
    logger.info(`[Webhook:PayloadCMS] Hierarchy sync completed for ${collection}: ${result.created} created, ${result.updated} updated, ${result.failed} failed, correlation: ${correlationId}`)
  } catch (error: unknown) {}
}

async function handleContentSync(collection: string, data: any, correlationId: string, req: MedusaRequest) {
  const docId = data.id || data.doc?.id
  logger.info(`[Webhook:PayloadCMS] Content sync for ${collection}, doc=${docId}, correlation: ${correlationId}`)

  try {
    const { PayloadToMedusaSync } = require("../../../integrations/payload-sync/payload-to-medusa")
    const payloadUrl = appConfig.payloadCms.url
    const payloadApiKey = appConfig.payloadCms.apiKey
    if (payloadUrl && payloadApiKey && docId) {
      const sync = new PayloadToMedusaSync(req.scope, { payloadUrl, payloadApiKey })
      await sync.syncProductContent(docId)
      logger.info(`[Webhook:PayloadCMS] Content synced for ${collection}/${docId}, correlation: ${correlationId}`)
    } else {
      logger.info(`[Webhook:PayloadCMS] Skipping content sync — missing env vars or doc ID, correlation: ${correlationId}`)
    }
  } catch (error: unknown) {}
}

async function handleDelete(collection: string, data: any, correlationId: string) {
  const docId = data.id || data.doc?.id
  logger.info(`[Webhook:PayloadCMS] Delete event for ${collection}, doc=${docId}, data=${JSON.stringify(data)}, correlation: ${correlationId}`)

  try {
    const { durableSyncTracker } = require("../../../lib/platform/sync-tracker")
    await durableSyncTracker.recordSync({
      system: "payload-cms",
      entity_type: collection,
      entity_id: docId || "unknown",
      direction: "inbound",
      tenant_id: data.tenantId || data.tenant || "system",
    })
    logger.info(`[Webhook:PayloadCMS] Deletion recorded for ${collection}/${docId}, correlation: ${correlationId}`)
  } catch (error: unknown) {
    logger.info(`[Webhook:PayloadCMS] Sync tracker not available for deletion recording: ${(error instanceof Error ? error.message : String(error))}`)
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const correlationId = crypto.randomUUID()

  if (!appConfig.payloadCms.isConfigured) {
    return res.status(503).json({ success: false, message: "Service not configured", service: "payload-cms" })
  }

  try {
    const secret = appConfig.payloadCms.webhookSecret
    if (secret) {
      const signature = req.headers["x-payload-signature"] as string || req.headers["x-webhook-signature"] as string
      if (!signature) {
        logger.info(`[Webhook:PayloadCMS] Missing signature header (correlation: ${correlationId})`)
        return res.status(400).json({ error: "Missing signature" })
      }

      const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body)
      if (!verifyPayloadSignature(rawBody, signature, secret)) {
        logger.info(`[Webhook:PayloadCMS] Signature verification failed (correlation: ${correlationId})`)
        return res.status(400).json({ error: "Invalid signature" })
      }
    }

    const body = req.body as Record<string, any>
    const event = body.event || "unknown"
    const collection = body.collection || "unknown"
    const data = body.data || body.doc || body

    logger.info(`[Webhook:PayloadCMS] Received event: ${event}, collection: ${collection} (correlation: ${correlationId})`)

    if (!(SUPPORTED_COLLECTIONS as readonly string[]).includes(collection)) {
      logger.info(`[Webhook:PayloadCMS] Unsupported collection: ${collection}, correlation: ${correlationId}`)
      return res.status(200).json({ received: true, event, collection, correlation_id: correlationId, status: "unsupported_collection" })
    }

    if (event.endsWith(".create") || event.endsWith(".update")) {
      if (isHierarchyCollection(collection)) {
        await handleHierarchySync(collection, data, correlationId, req)
      } else if (isContentCollection(collection)) {
        await handleContentSync(collection, data, correlationId, req)
      }
    } else if (event.endsWith(".delete")) {
      await handleDelete(collection, data, correlationId)
    } else {
      logger.info(`[Webhook:PayloadCMS] Unhandled event type: ${event} for collection: ${collection}, correlation: ${correlationId}`)
    }

    return res.status(200).json({ received: true, event, collection, correlation_id: correlationId })
  } catch (error: unknown) {
    return handleApiError(res, error, "WEBHOOKS-PAYLOAD-CMS")}
}

