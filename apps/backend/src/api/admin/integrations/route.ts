import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createLogger } from "../../../lib/logger"
import { handleApiError } from "../../../lib/api-error-handler"
import { appConfig } from "../../../lib/config"
const logger = createLogger("api:admin/integrations")

const INTEGRATION_SYSTEMS = [
  { name: "payload", isConfigured: () => appConfig.payloadCms.isConfigured },
  { name: "erpnext", isConfigured: () => appConfig.erpnext.isConfigured },
  { name: "fleetbase", isConfigured: () => appConfig.fleetbase.isConfigured },
  { name: "waltid", isConfigured: () => appConfig.waltid.isConfigured },
  { name: "stripe", isConfigured: () => appConfig.stripe.isConfigured },
  { name: "temporal", isConfigured: () => appConfig.temporal.isConfigured },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const systems = INTEGRATION_SYSTEMS.map((system) => {
      const configured = system.isConfigured()
      return {
        name: system.name,
        configured,
        last_sync_time: null,
        status: configured ? "active" : "not_configured",
      }
    })

    return res.json({
      systems,
      total: systems.length,
      configured_count: systems.filter((s) => s.configured).length,
    })
  } catch (error: unknown) {
    logger.error(`[Integrations] fetching integration overview: ${(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error))}`)
    return handleApiError(res, error, "ADMIN-INTEGRATIONS")}
}

