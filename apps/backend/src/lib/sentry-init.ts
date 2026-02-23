import * as Sentry from "@sentry/node"
import { appConfig } from "./config"
import { createLogger } from "./logger"

const logger = createLogger("sentry")

let initialized = false

export function initSentry() {
  if (initialized) return
  initialized = true

  if (!appConfig.sentry.isConfigured) {
    logger.info("Sentry DSN not configured — error monitoring disabled")
    return
  }

  Sentry.init({
    dsn: appConfig.sentry.dsn,
    environment: appConfig.nodeEnv,
    release: appConfig.appVersion,
    tracesSampleRate: appConfig.isProduction ? 0.2 : 1.0,
    sendDefaultPii: false,
    integrations: [
      Sentry.httpIntegration(),
    ],
  })

  logger.info("Sentry initialized successfully")
}
