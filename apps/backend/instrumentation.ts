import { appConfig } from "./src/lib/config"
import { createLogger } from "./src/lib/logger"
import { initGracefulShutdown } from "./src/lib/middleware/graceful-shutdown"

const logger = createLogger("instrumentation")

export function register() {
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
