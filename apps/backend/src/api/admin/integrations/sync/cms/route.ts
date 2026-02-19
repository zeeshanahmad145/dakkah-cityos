// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { createLogger } from "../../../../../lib/logger"
import { handleApiError } from "../../../../../lib/api-error-handler"
const logger = createLogger("api:admin/integrations")

const VALID_COLLECTIONS = [
  "countries",
  "governance-authorities",
  "scopes",
  "categories",
  "subcategories",
  "tenants",
  "stores",
  "portals",
]

const cmsSyncSchema = z.object({
  collection: z.string().optional(),
  force: z.boolean().optional(),
}).passthrough()

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = cmsSyncSchema.safeParse(req.body || {})
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const { collection, force } = parsed.data

    if (collection && !VALID_COLLECTIONS.includes(collection)) {
      return res.status(400).json({
        error: `Invalid collection. Must be one of: ${VALID_COLLECTIONS.join(", ")}`,
      })
    }

    const payloadUrl = process.env.PAYLOAD_CMS_URL_DEV || process.env.PAYLOAD_CMS_URL
    const payloadApiKey = process.env.PAYLOAD_API_KEY
    const erpnextUrl = process.env.ERPNEXT_URL_DEV
    const erpnextApiKey = process.env.ERPNEXT_API_KEY
    const erpnextApiSecret = process.env.ERPNEXT_API_SECRET

    if (!payloadUrl || !payloadApiKey) {
      return res.status(503).json({ success: false, message: "Service not configured", service: "payload-cms" })
    }

    if (!erpnextUrl || !erpnextApiKey || !erpnextApiSecret) {
      return res.status(503).json({ success: false, message: "Service not configured", service: "erpnext" })
    }

    const startTime = Date.now()

    const { createHierarchySyncEngine } = require("../../../../../integrations/cms-hierarchy-sync/engine")
    const engine = createHierarchySyncEngine({
      payloadUrl,
      payloadApiKey,
      erpnextUrl,
      erpnextApiKey,
      erpnextApiSecret,
    })

    let results
    if (collection) {
      logger.info(`[CMSSyncAPI] Manual sync triggered for collection: ${collection} (force: ${!!force})`)
      const result = await engine.syncCollection(collection)
      results = [result]
    } else {
      logger.info(`[CMSSyncAPI] Manual sync triggered for all collections (force: ${!!force})`)
      results = await engine.syncAll()
    }

    const duration = Date.now() - startTime

    const summary = {
      total_synced: results.reduce((sum, r) => sum + r.total, 0),
      total_created: results.reduce((sum, r) => sum + r.created, 0),
      total_updated: results.reduce((sum, r) => sum + r.updated, 0),
      total_failed: results.reduce((sum, r) => sum + r.failed, 0),
    }

    return res.json({
      success: true,
      collection: collection || "all",
      duration_ms: duration,
      summary,
      results,
    })
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-INTEGRATIONS-SYNC-CMS")}
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const payloadUrl = process.env.PAYLOAD_CMS_URL_DEV || process.env.PAYLOAD_CMS_URL
    const payloadApiKey = process.env.PAYLOAD_API_KEY
    const erpnextUrl = process.env.ERPNEXT_URL_DEV
    const erpnextApiKey = process.env.ERPNEXT_API_KEY
    const erpnextApiSecret = process.env.ERPNEXT_API_SECRET

    return res.json({
      collections: VALID_COLLECTIONS,
      payload_cms: {
        configured: !!(payloadUrl && payloadApiKey),
        url: payloadUrl ? payloadUrl.replace(/\/\/(.+?)@/, "//<redacted>@") : null,
      },
      erpnext: {
        configured: !!(erpnextUrl && erpnextApiKey && erpnextApiSecret),
        url: erpnextUrl || null,
      },
      schedule: "*/15 * * * *",
      job_name: "payload-cms-poll",
    })
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-INTEGRATIONS-SYNC-CMS")}
}

