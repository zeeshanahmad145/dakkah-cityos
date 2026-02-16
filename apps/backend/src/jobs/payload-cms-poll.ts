// @ts-nocheck
import { MedusaContainer } from "@medusajs/framework/types"
import { createLogger } from "../lib/logger"
const logger = createLogger("jobs:payload-cms-poll")

export default async function payloadCmsPollJob(container: MedusaContainer) {
  const payloadUrl = process.env.PAYLOAD_CMS_URL_DEV || process.env.PAYLOAD_CMS_URL
  const payloadApiKey = process.env.PAYLOAD_API_KEY
  const erpnextUrl = process.env.ERPNEXT_URL_DEV
  const erpnextApiKey = process.env.ERPNEXT_API_KEY
  const erpnextApiSecret = process.env.ERPNEXT_API_SECRET

  if (!payloadUrl || !payloadApiKey) {
    logger.info("[PayloadCMSPoll] Payload CMS not configured, skipping poll")
    return
  }

  if (!erpnextUrl || !erpnextApiKey || !erpnextApiSecret) {
    logger.info("[PayloadCMSPoll] ERPNext not configured, skipping hierarchy sync to ERPNext")
    return
  }

  try {
    logger.info("[PayloadCMSPoll] Starting CMS hierarchy sync poll...")

    const { createHierarchySyncEngine } = require("../integrations/cms-hierarchy-sync/engine")
    const engine = createHierarchySyncEngine({
      payloadUrl,
      payloadApiKey,
      erpnextUrl,
      erpnextApiKey,
      erpnextApiSecret,
    })

    if (!engine) {
      logger.info("[PayloadCMSPoll] CMS sync engine not available, skipping poll")
      return
    }

    const results = await engine.syncAll()

    let totalSynced = 0
    let totalCreated = 0
    let totalUpdated = 0
    let totalFailed = 0

    for (const result of results) {
      totalSynced += result.total
      totalCreated += result.created
      totalUpdated += result.updated
      totalFailed += result.failed

      if (result.total > 0 || result.failed > 0) {
        logger.info(`[PayloadCMSPoll] ${result.collection}: ${result.total} synced, ${result.created} created, ${result.updated} updated, ${result.failed} failed`)
      }
    }

    logger.info(`[PayloadCMSPoll] Poll complete: ${totalSynced} total, ${totalCreated} created, ${totalUpdated} updated, ${totalFailed} failed`)
  } catch (error: any) {
    logger.error(`[PayloadCMSPoll] Error during hierarchy sync: ${error.message}`)
  }
}

export const config = {
  name: "payload-cms-poll",
  schedule: "*/15 * * * *",
}
