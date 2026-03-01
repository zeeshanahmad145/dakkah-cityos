import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createIntegrationOrchestrator } from "../../../../integrations/orchestrator/index"
import { createLogger } from "../../../../lib/logger"
import { handleApiError } from "../../../../lib/api-error-handler"
const logger = createLogger("api:admin/integrations")

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const system = req.query.system as string | undefined
    const entity_type = req.query.entity_type as string | undefined
    const status = req.query.status as string | undefined
    const from_date = req.query.from_date as string | undefined
    const to_date = req.query.to_date as string | undefined
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    const orchestrator = createIntegrationOrchestrator(req.scope)
    const dashboard = await orchestrator.getSyncDashboard()
    let logs = dashboard.recentSyncs

    if (system) {
      logs = logs.filter((l) => l.system === system)
    }
    if (entity_type) {
      logs = logs.filter((l) => l.entity_type === entity_type)
    }
    if (status) {
      logs = logs.filter((l) => l.status === status)
    }
    if (from_date) {
      const fromTime = new Date(from_date).getTime()
      logs = logs.filter((l) => new Date(l.created_at).getTime() >= fromTime)
    }
    if (to_date) {
      const toTime = new Date(to_date).getTime()
      logs = logs.filter((l) => new Date(l.created_at).getTime() <= toTime)
    }

    const total = logs.length
    const paginatedLogs = logs.slice(offset, offset + limit)

    return res.json({
      items: paginatedLogs,
      total,
      limit,
      offset,
      has_more: offset + limit < total,
    })
  } catch (error: unknown) {
    logger.error(`[IntegrationLogs] fetching sync logs: ${(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error))}`)
    return handleApiError(res, error, "ADMIN-INTEGRATIONS-LOGS")}
}

