import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"
import { createLogger } from "../../../../lib/logger"
import { handleApiError } from "../../../../lib/api-error-handler"
import { appConfig } from "../../../../lib/config"
const logger = createLogger("api:admin/webhooks")

// Webhook payloads validated by signature verification
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!appConfig.payloadCms.isConfigured) {
    return res.status(503).json({ success: false, message: "Service not configured", service: "payload-cms" })
  }

  try {
    const secret = appConfig.payloadCms.webhookSecret
    if (secret) {
      const signature = req.headers["x-payload-signature"] as string
      const expectedSig = crypto.createHmac("sha256", secret).update(JSON.stringify(req.body)).digest("hex")
      if (signature !== expectedSig) {
        logger.info("[Webhook:Payload] Invalid signature")
        return res.status(401).json({ error: "Invalid signature" })
      }
    }

    const body = req.body as Record<string, any>
    const event = body.event || (body.collection && body.operation ? `${body.collection}.${body.operation}` : "unknown")

    logger.info(`[Webhook:Payload] Received event: ${event}`)

    let processed = false

    // Inbound webhook handlers: External system (Payload CMS) → Medusa local data.
    // These are intentionally direct calls (not routed through Temporal) because they
    // only update local Medusa data based on external system notifications.
    // Cross-system OUTBOUND calls (Medusa → external) must go through Temporal.
    switch (event) {
      case "product.published":
      case "product.updated": {
        const contentId = body.data?.id || body.doc?.id
        if (contentId) {
          try {
            const { PayloadToMedusaSync } = await import("../../../../integrations/payload-sync/payload-to-medusa.js")
            const payloadUrl = appConfig.payloadCms.url
            const payloadApiKey = appConfig.payloadCms.apiKey
            if (payloadUrl && payloadApiKey) {
              const sync = new PayloadToMedusaSync(req.scope, { payloadUrl, payloadApiKey })
              await sync.syncProductContent(contentId)
              processed = true
              logger.info(`[Webhook:Payload] Product content synced: ${contentId}`)
            } else {
              logger.info("[Webhook:Payload] Missing PAYLOAD_CMS_URL_DEV or PAYLOAD_API_KEY, skipping sync")
            }
          } catch (error: unknown) {
            logger.error(`[Webhook:Payload] syncing product content: ${error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : error}`)}
        }
        break
      }

      case "page.published": {
        const pageId = body.data?.id || body.doc?.id
        if (pageId) {
          try {
            const { PayloadToMedusaSync } = await import("../../../../integrations/payload-sync/payload-to-medusa.js")
            const payloadUrl = appConfig.payloadCms.url
            const payloadApiKey = appConfig.payloadCms.apiKey
            if (payloadUrl && payloadApiKey) {
              const sync = new PayloadToMedusaSync(req.scope, { payloadUrl, payloadApiKey })
              await sync.syncPage(pageId)
              processed = true
              logger.info(`[Webhook:Payload] Page synced: ${pageId}`)
            }
          } catch (error: unknown) {
            logger.error(`[Webhook:Payload] syncing page: ${error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : error}`)}
        }
        break
      }

      case "navigation.create":
      case "navigation.update": {
        const navId = body.data?.id || body.doc?.id
        logger.info(`[Webhook:Payload] Navigation updated: ${navId}`)
        processed = true
        break
      }

      case "vertical.create":
      case "vertical.update": {
        const verticalId = body.data?.id || body.doc?.id
        logger.info(`[Webhook:Payload] Vertical updated: ${verticalId}`)
        processed = true
        break
      }

      case "page.create":
      case "page.update":
      case "page.delete": {
        const pageId = body.data?.id || body.doc?.id
        const pagePath = body.data?.path || body.doc?.path
        logger.info(`[Webhook:Payload] Page ${event}: ${pageId} (path: ${pagePath || "unknown"})`)
        processed = true
        break
      }

      case "media.uploaded": {
        const mediaId = body.data?.id || body.doc?.id
        if (mediaId) {
          try {
            const { PayloadToMedusaSync } = await import("../../../../integrations/payload-sync/payload-to-medusa.js")
            const payloadUrl = appConfig.payloadCms.url
            const payloadApiKey = appConfig.payloadCms.apiKey
            if (payloadUrl && payloadApiKey) {
              const sync = new PayloadToMedusaSync(req.scope, { payloadUrl, payloadApiKey })
              await sync.syncMedia(mediaId)
              processed = true
              logger.info(`[Webhook:Payload] Media synced: ${mediaId}`)
            }
          } catch (error: unknown) {
            logger.error(`[Webhook:Payload] syncing media: ${error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : error}`)}
        }
        break
      }

      case "tenant.updated": {
        const tenantId = body.data?.medusaTenantId || body.doc?.medusaTenantId
        logger.info(`[Webhook:Payload] Tenant updated notification received: ${tenantId || "unknown"}`)
        processed = true
        break
      }

      case "store.updated": {
        const storeId = body.data?.medusaStoreId || body.doc?.medusaStoreId
        logger.info(`[Webhook:Payload] Store updated notification received: ${storeId || "unknown"}`)
        processed = true
        break
      }

      default:
        logger.info(`[Webhook:Payload] Unhandled event: ${event}`)
        break
    }

    return res.status(200).json({ received: true, event, processed })
  } catch (error: unknown) {
    logger.error(`[Webhook:Payload] ${error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : error}`)
    return handleApiError(res, error, "ADMIN-WEBHOOKS-PAYLOAD")}
}

