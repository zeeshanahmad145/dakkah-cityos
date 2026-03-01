import { createLogger } from "../../lib/logger"
const logger = createLogger("lib:middleware")
const shutdownHandlers: Array<() => Promise<void>> = []
let isShuttingDown = false

export function registerShutdownHandler(handler: () => Promise<void>) {
  shutdownHandlers.push(handler)
}

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return
  isShuttingDown = true

  logger.info(String(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Received ${signal}. Starting graceful shutdown...`,
      type: "lifecycle",
    }))
  )

  const shutdownTimeout = setTimeout(() => {
    logger.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Graceful shutdown timed out after 30s. Forcing exit.",
        type: "lifecycle",
      })
    )
    process.exit(1)
  }, 30_000)

  for (const handler of shutdownHandlers) {
    try {
      await handler()
    } catch (error) {
      logger.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          message: "Shutdown handler failed",
          error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error),
          type: "lifecycle",
        })
      )
    }
  }

  clearTimeout(shutdownTimeout)

  logger.info(String(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Graceful shutdown complete.",
      type: "lifecycle",
    }))
  )

  process.exit(0)
}

export function initGracefulShutdown() {
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
  process.on("SIGINT", () => gracefulShutdown("SIGINT"))

  process.on("uncaughtException", (error) => {
    logger.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Uncaught exception",
        error: { name: error.name, message: (error instanceof Error ? error.message : String(error)), stack: error.stack },
        type: "lifecycle",
      })
    )
    gracefulShutdown("uncaughtException")
  })

  process.on("unhandledRejection", (reason) => {
    logger.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Unhandled rejection",
        error: reason instanceof Error
          ? { name: reason.name, message: reason.message, stack: reason.stack }
          : { message: String(reason) },
        type: "lifecycle",
      })
    )
  })
}
