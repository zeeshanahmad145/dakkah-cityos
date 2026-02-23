import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { checkTemporalHealth } from "../../../../lib/temporal-client"
import { createLogger } from "../../../../lib/logger"
import { handleApiError } from "../../../../lib/api-error-handler"
import { appConfig } from "../../../../lib/config"
const logger = createLogger("api:admin/integrations")

interface SystemHealthCheck {
  name: string
  url?: string
  envVar: string
  headers?: Record<string, string>
}

const SYSTEMS: SystemHealthCheck[] = [
  { name: "payload", envVar: "PAYLOAD_CMS_URL_DEV" },
  { name: "erpnext", envVar: "ERPNEXT_URL_DEV" },
  { name: "fleetbase", envVar: "FLEETBASE_URL_DEV" },
  { name: "waltid", envVar: "WALTID_URL_DEV" },
  { name: "stripe", envVar: "STRIPE_SECRET_KEY" },
]

async function checkSystemHealth(system: SystemHealthCheck): Promise<{
  name: string
  status: "healthy" | "unhealthy" | "not_configured"
  latency_ms: number
  error?: string
}> {
  const configMap: Record<string, string> = {
    PAYLOAD_CMS_URL_DEV: appConfig.payloadCms.url,
    ERPNEXT_URL_DEV: appConfig.erpnext.url,
    FLEETBASE_URL_DEV: appConfig.fleetbase.url,
    WALTID_URL_DEV: appConfig.waltid.url,
    STRIPE_SECRET_KEY: appConfig.stripe.secretKey,
  }
  const baseUrl = configMap[system.envVar]

  if (!baseUrl) {
    return { name: system.name, status: "not_configured", latency_ms: 0 }
  }

  const start = Date.now()
  try {
    if (system.name === "stripe") {
      const Stripe = (await import("stripe")).default
      const stripe = new Stripe(baseUrl)
      await stripe.balance.retrieve()
      const latency_ms = Date.now() - start
      return { name: system.name, status: "healthy", latency_ms }
    }

    const axios = (await import("axios")).default
    const headers: Record<string, string> = { ...system.headers }

    if (system.name === "payload" && appConfig.payloadCms.apiKey) {
      headers["Authorization"] = `Bearer ${appConfig.payloadCms.apiKey}`
    } else if (system.name === "erpnext" && appConfig.erpnext.apiKey && appConfig.erpnext.apiSecret) {
      headers["Authorization"] = `token ${appConfig.erpnext.apiKey}:${appConfig.erpnext.apiSecret}`
    } else if (system.name === "fleetbase" && appConfig.fleetbase.apiKey) {
      headers["Authorization"] = `Bearer ${appConfig.fleetbase.apiKey}`
      if (appConfig.fleetbase.orgId) {
        headers["Organization-ID"] = appConfig.fleetbase.orgId
      }
    } else if (system.name === "waltid" && appConfig.waltid.apiKey) {
      headers["Authorization"] = `Bearer ${appConfig.waltid.apiKey}`
    }

    await axios.get(baseUrl, {
      timeout: 3000,
      headers,
      validateStatus: (status: number) => status >= 200 && status < 500,
    })

    const latency_ms = Date.now() - start
    return { name: system.name, status: "healthy", latency_ms }
  } catch (error: any) {
    const latency_ms = Date.now() - start
    return {
      name: system.name,
      status: "unhealthy",
      latency_ms,
      error: error.message,}
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const healthChecks = await Promise.all(
      SYSTEMS.map((system) => checkSystemHealth(system))
    )

    let temporalResult: {
      name: string
      status: "healthy" | "unhealthy" | "not_configured"
      latency_ms: number
      error?: string
    }

    if (!appConfig.temporal.isConfigured) {
      temporalResult = { name: "temporal", status: "not_configured", latency_ms: 0 }
    } else {
      const start = Date.now()
      try {
        const health = await checkTemporalHealth()
        const latency_ms = Date.now() - start
        temporalResult = {
          name: "temporal",
          status: health.connected ? "healthy" : "unhealthy",
          latency_ms,
          error: health.error,
        }
      } catch (error: any) {
        temporalResult = {
          name: "temporal",
          status: "unhealthy",
          latency_ms: Date.now() - start,
          error: error.message,}
      }
    }

    healthChecks.push(temporalResult)

    return res.json({ systems: healthChecks })
  } catch (error: any) {
    logger.error(`[IntegrationHealth] checking health: ${error.message}`)
    return handleApiError(res, error, "ADMIN-INTEGRATIONS-HEALTH")}
}

