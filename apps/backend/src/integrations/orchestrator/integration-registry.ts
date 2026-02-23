import { appConfig } from "../../lib/config"
import { createLogger } from "../../lib/logger"
const logger = createLogger("integration:orchestrator")
export interface IIntegrationAdapter {
  name: string
  healthCheck(): Promise<{ healthy: boolean; message?: string }>
  isConfigured(): boolean
  syncEntity(type: string, id: string, data: any): Promise<{ success: boolean; externalId?: string; error?: string }>
  handleWebhook(event: string, payload: any): Promise<{ processed: boolean; error?: string }>
}

export interface IntegrationHealthStatus {
  system: string
  configured: boolean
  healthy: boolean
  message?: string
  checkedAt: Date
}

export class IntegrationRegistry {
  private adapters: Map<string, IIntegrationAdapter> = new Map()

  registerAdapter(adapter: IIntegrationAdapter): void {
    this.adapters.set(adapter.name, adapter)
    logger.info(`[IntegrationOrchestrator] Adapter registered: ${adapter.name} (configured: ${adapter.isConfigured()})`)
  }

  getAdapter(name: string): IIntegrationAdapter | undefined {
    return this.adapters.get(name)
  }

  getAllAdapters(): IIntegrationAdapter[] {
    return Array.from(this.adapters.values())
  }

  async getHealthStatus(): Promise<IntegrationHealthStatus[]> {
    const results: IntegrationHealthStatus[] = []

    for (const adapter of this.adapters.values()) {
      const status: IntegrationHealthStatus = {
        system: adapter.name,
        configured: adapter.isConfigured(),
        healthy: false,
        checkedAt: new Date(),
      }

      if (!adapter.isConfigured()) {
        status.message = "Not configured (missing environment variables)"
        results.push(status)
        continue
      }

      try {
        const health = await adapter.healthCheck()
        status.healthy = health.healthy
        status.message = health.message
      } catch (error: any) {
        status.healthy = false
        status.message = error.message
      }

      results.push(status)
    }

    return results
  }
}

export function createDefaultAdapters(): IIntegrationAdapter[] {
  const adapters: IIntegrationAdapter[] = [
    {
      name: "payload",
      isConfigured: () => appConfig.payloadCms.isConfigured && !!appConfig.payloadCms.apiKey,
      async healthCheck() {
        try {
          const axios = (await import("axios")).default
          const res = await axios.get(`${appConfig.payloadCms.url}/api/health`, {
            headers: { Authorization: `Bearer ${appConfig.payloadCms.apiKey}` },
            timeout: 5000,
          })
          return { healthy: res.status === 200, message: "Payload CMS reachable" }
        } catch (err: any) {
          return { healthy: false, message: err.message }
        }
      },
      async syncEntity(type, id, data) {
        if (!this.isConfigured()) return { success: false, error: "Payload not configured" }
        try {
          const axios = (await import("axios")).default
          await axios.post(`${appConfig.payloadCms.url}/api/${type}`, { medusaId: id, ...data }, {
            headers: {
              Authorization: `Bearer ${appConfig.payloadCms.apiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          })
          return { success: true }
        } catch (err: any) {
          return { success: false, error: err.message }
        }
      },
      async handleWebhook(event, payload) {
        logger.info(`[IntegrationOrchestrator] Payload webhook: ${event}`)
        return { processed: true }
      },
    },
    {
      name: "erpnext",
      isConfigured: () => appConfig.erpnext.isConfigured,
      async healthCheck() {
        try {
          const axios = (await import("axios")).default
          const res = await axios.get(`${appConfig.erpnext.url}/api/method/frappe.auth.get_logged_user`, {
            headers: { Authorization: `token ${appConfig.erpnext.apiKey}:${appConfig.erpnext.apiSecret}` },
            timeout: 5000,
          })
          return { healthy: res.status === 200, message: "ERPNext reachable" }
        } catch (err: any) {
          return { healthy: false, message: err.message }
        }
      },
      async syncEntity(type, id, data) {
        if (!this.isConfigured()) return { success: false, error: "ERPNext not configured" }
        try {
          const axios = (await import("axios")).default
          const res = await axios.post(`${appConfig.erpnext.url}/api/resource/${type}`, { ...data, custom_medusa_id: id }, {
            headers: {
              Authorization: `token ${appConfig.erpnext.apiKey}:${appConfig.erpnext.apiSecret}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          })
          return { success: true, externalId: res.data?.data?.name }
        } catch (err: any) {
          return { success: false, error: err.message }
        }
      },
      async handleWebhook(event, payload) {
        logger.info(`[IntegrationOrchestrator] ERPNext webhook: ${event}`)
        return { processed: true }
      },
    },
    {
      name: "fleetbase",
      isConfigured: () => appConfig.fleetbase.isConfigured,
      async healthCheck() {
        try {
          const axios = (await import("axios")).default
          const res = await axios.get(`${appConfig.fleetbase.url}/health`, {
            headers: { Authorization: `Bearer ${appConfig.fleetbase.apiKey}` },
            timeout: 5000,
          })
          return { healthy: res.status === 200, message: "Fleetbase reachable" }
        } catch (err: any) {
          return { healthy: false, message: err.message }
        }
      },
      async syncEntity(type, id, data) {
        if (!this.isConfigured()) return { success: false, error: "Fleetbase not configured" }
        try {
          const axios = (await import("axios")).default
          const res = await axios.post(`${appConfig.fleetbase.url}/${type}`, { medusa_id: id, ...data }, {
            headers: {
              Authorization: `Bearer ${appConfig.fleetbase.apiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          })
          return { success: true, externalId: res.data?.id }
        } catch (err: any) {
          return { success: false, error: err.message }
        }
      },
      async handleWebhook(event, payload) {
        logger.info(`[IntegrationOrchestrator] Fleetbase webhook: ${event}`)
        return { processed: true }
      },
    },
    {
      name: "waltid",
      isConfigured: () => appConfig.waltid.isConfigured,
      async healthCheck() {
        try {
          const axios = (await import("axios")).default
          const res = await axios.get(`${appConfig.waltid.url}/health`, {
            headers: { Authorization: `Bearer ${appConfig.waltid.apiKey}` },
            timeout: 5000,
          })
          return { healthy: res.status === 200, message: "Walt.id reachable" }
        } catch (err: any) {
          return { healthy: false, message: err.message }
        }
      },
      async syncEntity(type, id, data) {
        if (!this.isConfigured()) return { success: false, error: "Walt.id not configured" }
        try {
          const axios = (await import("axios")).default
          const res = await axios.post(`${appConfig.waltid.url}/credentials/${type}`, { subjectId: id, ...data }, {
            headers: {
              Authorization: `Bearer ${appConfig.waltid.apiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          })
          return { success: true, externalId: res.data?.id }
        } catch (err: any) {
          return { success: false, error: err.message }
        }
      },
      async handleWebhook(event, payload) {
        logger.info(`[IntegrationOrchestrator] Walt.id webhook: ${event}`)
        return { processed: true }
      },
    },
    {
      name: "stripe",
      isConfigured: () => !!appConfig.stripe.secretKey,
      async healthCheck() {
        try {
          const axios = (await import("axios")).default
          const res = await axios.get("https://api.stripe.com/v1/balance", {
            headers: { Authorization: `Bearer ${appConfig.stripe.secretKey}` },
            timeout: 5000,
          })
          return { healthy: res.status === 200, message: "Stripe reachable" }
        } catch (err: any) {
          return { healthy: false, message: err.message }
        }
      },
      async syncEntity(type, id, data) {
        if (!this.isConfigured()) return { success: false, error: "Stripe not configured" }
        try {
          const axios = (await import("axios")).default
          const res = await axios.post(`https://api.stripe.com/v1/${type}`, data, {
            headers: {
              Authorization: `Bearer ${appConfig.stripe.secretKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout: 10000,
          })
          return { success: true, externalId: res.data?.id }
        } catch (err: any) {
          return { success: false, error: err.message }
        }
      },
      async handleWebhook(event, payload) {
        logger.info(`[IntegrationOrchestrator] Stripe webhook: ${event}`)
        return { processed: true }
      },
    },
  ]

  return adapters
}
