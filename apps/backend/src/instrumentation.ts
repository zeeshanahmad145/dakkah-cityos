import * as Sentry from "@sentry/node"
import { initGracefulShutdown } from "./lib/middleware/graceful-shutdown"
import { appConfig } from "./lib/config"
import { createLogger } from "./lib/logger"

const logger = createLogger("instrumentation")

if (appConfig.sentry.isConfigured) {
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
} else {
  logger.info("Sentry DSN not configured — error monitoring disabled")
}

initGracefulShutdown()

const startupLog = {
  timestamp: new Date().toISOString(),
  level: "info",
  message: "CityOS Commerce Platform — graceful shutdown handlers registered",
  type: "lifecycle",
  pid: process.pid,
}

if (appConfig.isProduction) {
  logger.info(String(JSON.stringify(startupLog)))
} else {
  logger.info(`${startupLog.timestamp} INFO ${startupLog.message}`)
}
