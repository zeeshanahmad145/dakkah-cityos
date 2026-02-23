import * as Sentry from "@sentry/node"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { appConfig } from "../../../lib/config"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const client = Sentry.getClient()

  if (!appConfig.sentry.isConfigured) {
    return res.status(200).json({
      sentry_configured: false,
      message: "SENTRY_DSN is not set",
    })
  }

  if (!client) {
    return res.status(200).json({
      sentry_configured: true,
      sentry_initialized: false,
      message: "Sentry DSN is set but SDK was not initialized — loader may not have run",
    })
  }

  const testError = new Error("Sentry connectivity test from Dakkah CityOS")
  const eventId = Sentry.captureException(testError)

  await Sentry.flush(5000)

  return res.status(200).json({
    sentry_configured: true,
    sentry_initialized: true,
    event_id: eventId,
    message: "Test error sent to Sentry. Check your Sentry dashboard for this event.",
    dsn_redacted: appConfig.sentry.dsn.replace(/\/\/(.{8}).*@/, "//$1***@"),
    environment: appConfig.nodeEnv,
  })
}
