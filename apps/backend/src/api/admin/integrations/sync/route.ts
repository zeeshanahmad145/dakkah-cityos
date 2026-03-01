import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { createIntegrationOrchestrator } from "../../../../integrations/orchestrator/index"
import { createLogger } from "../../../../lib/logger"
import { handleApiError } from "../../../../lib/api-error-handler"
import { appConfig } from "../../../../lib/config"
const logger = createLogger("api:admin/integrations")

const VALID_SYSTEMS = ["payload", "erpnext", "fleetbase", "waltid", "stripe"]
const VALID_ENTITY_TYPES = ["product", "tenant", "store", "customer", "order", "node", "vendor"]

const syncSchema = z.object({
  system: z.enum(["payload", "erpnext", "fleetbase", "waltid", "stripe"]),
  entity_type: z.enum(["product", "tenant", "store", "customer", "order", "node", "vendor"]),
  entity_id: z.string().optional(),
  direction: z.enum(["outbound", "inbound"]).optional(),
  tenant_id: z.string().optional(),
}).passthrough()

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = syncSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const { system, entity_type, entity_id, direction } = parsed.data

    logger.info(`[IntegrationSync] Manual sync triggered: ${system}/${entity_type}/${entity_id || "all"}`)

    const { startWorkflow } = await import("../../../../lib/temporal-client.js")

    if (!appConfig.temporal.isConfigured) {
      return res.status(503).json({ error: "Temporal not configured. Manual sync requires Temporal." })
    }

    try {
      const workflowId = `manual-sync-${system}-${entity_type}-${Date.now()}`
      const result = await startWorkflow(workflowId, {
        system,
        entity_type,
        entity_id: entity_id || "all",
        direction: direction || "outbound",
        triggered_by: "admin",
      }, {
        tenantId: parsed.data.tenant_id,
        source: "admin-manual-sync",
      })

      logger.info(`[IntegrationSync] Manual sync dispatched to Temporal: ${result.runId}`)
      return res.json({ triggered: true, system, entity_type, entity_id: entity_id || "all", workflow_run_id: result.runId })
    } catch (error: unknown) {
      logger.error(`[IntegrationSync] dispatching manual sync: ${(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error))}`)
      return handleApiError(res, error, "ADMIN-INTEGRATIONS-SYNC")}
  } catch (error: unknown) {
    logger.error(`[IntegrationSync] triggering sync: ${(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error))}`)
    return handleApiError(res, error, "ADMIN-INTEGRATIONS-SYNC")}
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const orchestrator = createIntegrationOrchestrator(req.scope)
    const limit = parseInt(req.query.limit as string) || 50
    const systemFilter = req.query.system as string | undefined
    const statusFilter = req.query.status as string | undefined

    const dashboard = await orchestrator.getSyncDashboard()
    let recentSyncs = dashboard.recentSyncs

    if (systemFilter) {
      recentSyncs = recentSyncs.filter((s) => s.system === systemFilter)
    }
    if (statusFilter) {
      recentSyncs = recentSyncs.filter((s) => s.status === statusFilter)
    }

    recentSyncs = recentSyncs.slice(0, limit)

    return res.json({
      syncs: recentSyncs,
      total: recentSyncs.length,
      stats: dashboard.stats,
    })
  } catch (error: unknown) {
    logger.error(`[IntegrationSync] fetching sync operations: ${(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error))}`)
    return handleApiError(res, error, "ADMIN-INTEGRATIONS-SYNC")}
}

