import { appConfig } from "./src/lib/config"
import { createLogger } from "./src/lib/logger"
import { initGracefulShutdown } from "./src/lib/middleware/graceful-shutdown"
import { validateEnvironment, validateDatabaseConnection } from "./src/lib/env-validation"

const logger = createLogger("instrumentation")

export function register() {
  initGracefulShutdown()

  const envResult = validateEnvironment()
  console.log(envResult.summary)

  if (!envResult.valid) {
    logger.error("Startup blocked: required environment variables are missing. See above.")
  }

  validateDatabaseConnection()
    .then((dbResult) => {
      if (dbResult.connected) {
        console.log(`[DB] Connected successfully — ${dbResult.tableCount} tables in public schema`)
      } else {
        console.error(`[DB] Connection FAILED: ${dbResult.error}`)
      }
    })
    .catch((err) => {
      console.error(`[DB] Connection check error: ${err.message || err}`)
    })

  const startupLog = {
    timestamp: new Date().toISOString(),
    level: "info",
    message: "CityOS Commerce Platform — startup complete",
    type: "lifecycle",
    pid: process.pid,
  }

  if (appConfig.isProduction) {
    logger.info(String(JSON.stringify(startupLog)))
  } else {
    logger.info(`${startupLog.timestamp} INFO ${startupLog.message}`)
  }
}
