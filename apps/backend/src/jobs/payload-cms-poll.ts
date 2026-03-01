// @ts-nocheck
import { MedusaContainer } from "@medusajs/framework/types"
import { appConfig } from "../lib/config"
import { createLogger } from "../lib/logger"
const logger = createLogger("jobs:payload-cms-poll")

export default async function payloadCmsPollJob(container: MedusaContainer) {
  const payloadUrl = appConfig.payloadCms.url
  const payloadApiKey = appConfig.payloadCms.apiKey
  const erpnextUrl = appConfig.erpnext.url
  const erpnextApiKey = appConfig.erpnext.apiKey
  const erpnextApiSecret = appConfig.erpnext.apiSecret

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
  } catch (error: unknown) {
    logger.error(`[PayloadCMSPoll] Error during hierarchy sync: ${(error instanceof Error ? error.message : String(error))}`)
  }
}

export const config = {
  name: "payload-cms-poll",
  schedule: "*/15 * * * *",
}
