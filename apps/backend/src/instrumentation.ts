import { initGracefulShutdown } from "./lib/middleware/graceful-shutdown"
import { appConfig } from "./lib/config"
import { createLogger } from "./lib/logger"
const logger = createLogger("instrumentation")

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
