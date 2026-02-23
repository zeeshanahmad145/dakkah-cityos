import * as Sentry from "@sentry/node"
import { appConfig } from "./src/lib/config"
import { createLogger } from "./src/lib/logger"
import { initGracefulShutdown } from "./src/lib/middleware/graceful-shutdown"

const logger = createLogger("instrumentation")

export function register() {
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
}
