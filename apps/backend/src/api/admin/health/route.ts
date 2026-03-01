import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getCache } from "../../../lib/cache/redis-cache"
import { metrics } from "../../../lib/monitoring/metrics"
import { handleApiError } from "../../../lib/api-error-handler"
import { appConfig } from "../../../lib/config"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const startTime = Date.now()
  const checks: Record<string, unknown> = {}
  let overallStatus = "healthy"

  try {
    const query = req.scope.resolve("query") as unknown as any
    await query.graph({
      entity: "region",
      fields: ["id"],
      pagination: { take: 1 },
    })
    checks.database = { status: "healthy" }
  } catch (error: unknown) {
    checks.database = {
      status: "unhealthy",
      error: error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : "Connection failed",}
    overallStatus = "degraded"
  }

  const cache = getCache()
  const cacheHealthy = await cache.healthCheck()
  const cacheStats = await cache.getStats()
  checks.cache = {
    status: cacheHealthy ? "healthy" : "disabled",
    stats: cacheStats,
  }

  checks.integrations = {
    stripe: {
      status: appConfig.stripe.isConfigured ? "configured" : "not_configured",
      configured: appConfig.stripe.isConfigured,
    },
    temporal: {
      status: appConfig.temporal.endpoint ? "configured" : "not_configured",
      configured: !!appConfig.temporal.endpoint,
      namespace: appConfig.temporal.namespace || "not_set",
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
    sendgrid: {
      status: appConfig.sendgrid.isConfigured ? "configured" : "not_configured",
      configured: appConfig.sendgrid.isConfigured,
    },
    meilisearch: {
      status: appConfig.meilisearch.isConfigured ? "configured" : "not_configured",
      configured: appConfig.meilisearch.isConfigured,
    },
  }

  const memUsage = process.memoryUsage()
  const systemInfo = {
    uptime_seconds: Math.floor(process.uptime()),
    memory: {
      rss_mb: Math.round(memUsage.rss / 1024 / 1024),
      heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
      external_mb: Math.round(memUsage.external / 1024 / 1024),
    },
    node_version: process.version,
    platform: process.platform,
    pid: process.pid,
  }

  const responseTimeMs = Date.now() - startTime
  metrics.trackRequest("GET", "/admin/health", 200, responseTimeMs)

  const health = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: appConfig.appVersion,
    environment: appConfig.nodeEnv,
    checks,
    system: systemInfo,
    metrics: metrics.getSummary(),
    response_time_ms: responseTimeMs,
  }

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
  const statusCode = overallStatus === "healthy" ? 200 : 503
  return res.status(statusCode).json(health)
}

