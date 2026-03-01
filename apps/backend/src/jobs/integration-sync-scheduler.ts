import { MedusaContainer } from "@medusajs/framework/types"
import cron from "node-cron"
import { startWorkflow } from "../lib/temporal-client"
import { appConfig } from "../lib/config"
import { createLogger } from "../lib/logger"
const logger = createLogger("jobs:integration-sync-scheduler")

export class IntegrationSyncScheduler {
  private container: MedusaContainer
  private tasks: ReturnType<typeof cron.schedule>[] = []

  constructor(container: MedusaContainer) {
    this.container = container
  }

  start() {
    logger.info("[SyncScheduler] Starting integration sync scheduler (Temporal-dispatched)")

    const productSyncTask = cron.schedule("0 * * * *", async () => {
      try {
        if (!appConfig.temporal.isConfigured) {
          logger.info("[SyncScheduler] Temporal not configured, skipping scheduled product sync")
          return
        }
        const result = await startWorkflow("xsystem.scheduled-product-sync", {
          timestamp: new Date().toISOString(),
        }, {})
        logger.info(`[SyncScheduler] Dispatched product sync workflow: ${result.runId}`)
      } catch (err: any) {
        logger.warn(`[SyncScheduler] Failed to dispatch product sync: ${err.message}`)
      }
    })
    this.tasks.push(productSyncTask)

    const retryTask = cron.schedule("*/30 * * * *", async () => {
      try {
        if (!appConfig.temporal.isConfigured) {
          logger.info("[SyncScheduler] Temporal not configured, skipping retry sync")
          return
        }
        const result = await startWorkflow("xsystem.retry-failed-syncs", {
          timestamp: new Date().toISOString(),
        }, {})
        logger.info(`[SyncScheduler] Dispatched retry-failed-syncs workflow: ${result.runId}`)
      } catch (err: any) {
        logger.warn(`[SyncScheduler] Failed to dispatch retry sync: ${err.message}`)
      }
    })
    this.tasks.push(retryTask)

    const hierarchyTask = cron.schedule("0 */6 * * *", async () => {
      try {
        if (!appConfig.temporal.isConfigured) {
          logger.info("[SyncScheduler] Temporal not configured, skipping hierarchy reconciliation")
          return
        }
        const result = await startWorkflow("xsystem.scheduled-hierarchy-reconciliation", {
          timestamp: new Date().toISOString(),
        }, {})
        logger.info(`[SyncScheduler] Dispatched hierarchy reconciliation workflow: ${result.runId}`)
      } catch (err: any) {
        logger.warn(`[SyncScheduler] Failed to dispatch hierarchy reconciliation: ${err.message}`)
      }
    })
    this.tasks.push(hierarchyTask)

    const cleanupTask = cron.schedule("0 0 * * *", async () => {
      try {
        logger.info("[SyncScheduler] Cleaning up old sync logs")
        const { createIntegrationOrchestrator } = require("../integrations/orchestrator")
        const orchestrator = createIntegrationOrchestrator(this.container)
        const dashboard = await orchestrator.getSyncDashboard()
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const oldEntries = dashboard.recentSyncs.filter(
          (entry) => new Date(entry.created_at) < thirtyDaysAgo
        )
        logger.info(`[SyncScheduler] Cleanup complete: ${oldEntries.length} old log entries identified`)
      } catch (error: unknown) {
        logger.info(`[SyncScheduler] Log cleanup error: ${(error instanceof Error ? error.message : String(error))}`)
      }
    })
    this.tasks.push(cleanupTask)

    logger.info("[SyncScheduler] All sync jobs scheduled (dispatching to Temporal)")
  }

  stop() {
    logger.info("[SyncScheduler] Stopping integration sync scheduler")
    for (const task of this.tasks) {
      task.stop()
    }
    this.tasks = []
    logger.info("[SyncScheduler] All sync jobs stopped")
  }
}

export function createSyncScheduler(container: MedusaContainer): IntegrationSyncScheduler {
  return new IntegrationSyncScheduler(container)
}

export default async function integrationSyncSchedulerJob(container: MedusaContainer) {
  logger.info("[SyncScheduler] Running scheduled integration sync reconciliation (via Temporal)")

  try {
    if (!appConfig.temporal.isConfigured) {
      logger.info("[SyncScheduler] Temporal not configured, skipping scheduled sync")
      return
    }

    try {
      const productResult = await startWorkflow("xsystem.scheduled-product-sync", {
        timestamp: new Date().toISOString(),
      }, {})
      logger.info(`[SyncScheduler] Dispatched product sync workflow: ${productResult.runId}`)
    } catch (err: any) {
      logger.warn(`[SyncScheduler] Failed to dispatch product sync: ${err.message}`)
    }

    try {
      const retryResult = await startWorkflow("xsystem.retry-failed-syncs", {
        timestamp: new Date().toISOString(),
      }, {})
      logger.info(`[SyncScheduler] Dispatched retry-failed-syncs workflow: ${retryResult.runId}`)
    } catch (err: any) {
      logger.warn(`[SyncScheduler] Failed to dispatch retry sync: ${err.message}`)
    }

    try {
      const hierarchyResult = await startWorkflow("xsystem.scheduled-hierarchy-reconciliation", {
        timestamp: new Date().toISOString(),
      }, {})
      logger.info(`[SyncScheduler] Dispatched hierarchy reconciliation workflow: ${hierarchyResult.runId}`)
    } catch (err: any) {
      logger.warn(`[SyncScheduler] Failed to dispatch hierarchy reconciliation: ${err.message}`)
    }
  } catch (error: unknown) {
    logger.info(`[SyncScheduler] Integration sync scheduler error: ${(error instanceof Error ? error.message : String(error))}`)
  }
}

export const config = {
  name: "integration-sync-scheduler",
  schedule: "0 * * * *",
}
