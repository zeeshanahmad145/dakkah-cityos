import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"
import { appConfig } from "../../../lib/config"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const startTime = Date.now()

  const health: Record<string, unknown> = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: appConfig.appVersion,
    uptime_seconds: Math.floor(process.uptime()),
    checks: {} as Record<string, unknown>,
  }

  try {
    const query = req.scope.resolve("query") as unknown as any
    await query.graph({
      entity: "region",
      fields: ["id"],
      pagination: { take: 1 },
    })
    ;(health.checks as Record<string, unknown>).database = { status: "healthy" }
  } catch (error: unknown) {
    ;(health.checks as Record<string, unknown>).database = {
      status: "unhealthy",
      error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Connection failed",}
    health.status = "degraded"
  }

  const integrations: Record<string, { status: string; configured: boolean }> = {
    sentry: {
      status: appConfig.sentry.isConfigured ? "configured" : "not_configured",
      configured: appConfig.sentry.isConfigured,
    },
    stripe: {
      status: appConfig.stripe.isConfigured ? "configured" : "not_configured",
      configured: appConfig.stripe.isConfigured,
    },
    temporal: {
      status: appConfig.temporal.endpoint ? "configured" : "not_configured",
      configured: !!appConfig.temporal.endpoint,
    },
    payload_cms: {
      status: appConfig.payloadCms.isConfigured ? "configured" : "not_configured",
      configured: appConfig.payloadCms.isConfigured,
    },
    erpnext: {
      status: appConfig.erpnext.isConfigured ? "configured" : "not_configured",
      configured: appConfig.erpnext.isConfigured,
    },
    fleetbase: {
      status: appConfig.fleetbase.isConfigured ? "configured" : "not_configured",
      configured: appConfig.fleetbase.isConfigured,
    },
    waltid: {
      status: appConfig.waltid.isConfigured ? "configured" : "not_configured",
      configured: appConfig.waltid.isConfigured,
    },
  }

  ;(health.checks as Record<string, unknown>).integrations = integrations

  health.response_time_ms = Date.now() - startTime

  const statusCode = health.status === "healthy" ? 200 : 503
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
  return res.status(statusCode).json(health)
}

