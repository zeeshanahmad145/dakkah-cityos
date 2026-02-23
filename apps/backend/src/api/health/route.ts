// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { appConfig } from "../../lib/config"

const INTEGRATION_CHECKS = {
  temporal: {
    name: "Temporal Cloud",
    isConfigured: () => appConfig.temporal.isConfigured,
  },
  stripe: {
    name: "Stripe",
    isConfigured: () => appConfig.stripe.isConfigured,
  },
  erpnext: {
    name: "ERPNext",
    isConfigured: () => appConfig.erpnext.isConfigured,
  },
  fleetbase: {
    name: "Fleetbase",
    isConfigured: () => appConfig.fleetbase.isConfigured,
  },
  "payload-cms": {
    name: "Payload CMS",
    isConfigured: () => appConfig.payloadCms.isConfigured,
  },
  waltid: {
    name: "Walt.id",
    isConfigured: () => appConfig.waltid.isConfigured,
  },
  sendgrid: {
    name: "SendGrid",
    isConfigured: () => appConfig.sendgrid.isConfigured,
  },
  meilisearch: {
    name: "Meilisearch",
    isConfigured: () => appConfig.meilisearch.isConfigured,
  },
  sentry: {
    name: "Sentry",
    isConfigured: () => appConfig.sentry.isConfigured,
  },
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const startTime = Date.now()
  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy"
  const services: Record<string, any> = {}

  let dbStatus = "healthy"
  try {
    const query = req.scope.resolve("query")
    await query.graph({
      entity: "region",
      fields: ["id"],
      pagination: { take: 1 },
    })
    services.database = { status: "healthy" }
  } catch (error: any) {
    dbStatus = "unhealthy"
    overallStatus = "degraded"
    services.database = {
      status: "unhealthy",
      error: error.message,
    }
  }

  for (const [systemId, config] of Object.entries(INTEGRATION_CHECKS)) {
    const configured = config.isConfigured()
    services[systemId] = {
      name: config.name,
      configured,
    }
  }

  let circuitBreakerStates: Record<string, any> = {}
  try {
    const outboxMod = require("../../lib/platform/outbox-processor")
    circuitBreakerStates = outboxMod.getCircuitBreakerStates()
  } catch {
    circuitBreakerStates = { error: "Outbox processor not available" }
  }

  let temporalStatus: any = { connected: false, error: "Not checked" }
  try {
    const temporalMod = require("../../lib/temporal-client")
    temporalStatus = await temporalMod.checkTemporalHealth()
  } catch (error: any) {
    temporalStatus = { connected: false, error: error.message }
  }

  if (!temporalStatus.connected && services.temporal?.configured) {
    overallStatus = "degraded"
  }

  const configuredCount = Object.values(services).filter((s: any) => s.configured === true).length
  const totalSystems = Object.keys(INTEGRATION_CHECKS).length

  if (dbStatus === "unhealthy") {
    overallStatus = "unhealthy"
  }

  return res.status(overallStatus === "unhealthy" ? 503 : 200).json({
    status: overallStatus,
    environment: appConfig.nodeEnv,
    version: appConfig.appVersion,
    services,
    circuit_breakers: circuitBreakerStates,
    temporal: temporalStatus,
    summary: {
      configured_systems: configuredCount,
      total_systems: totalSystems,
      database: dbStatus,
    },
    timestamp: new Date().toISOString(),
    response_time_ms: Date.now() - startTime,
  })
}
