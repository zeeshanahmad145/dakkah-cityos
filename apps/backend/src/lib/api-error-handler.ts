import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { appConfig } from "./config"
import { createLogger } from "./logger"

const logger = createLogger("api")

export function handleApiError(
  res: MedusaResponse,
  error: unknown,
  context: string
) {
  const message = error instanceof Error ? error.message : String(error)
  logger.error(`${context}: ${message}`, error instanceof Error ? error : undefined)

  if (message.includes("not found") || message.includes("Not found")) {
    return res.status(404).json({ message: `${context}: not found` })
  }

  if (message.includes("unauthorized") || message.includes("Unauthorized")) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  if (message.includes("forbidden") || message.includes("Forbidden")) {
    return res.status(403).json({ message: "Forbidden" })
  }

  if (message.includes("validation") || message.includes("required") || message.includes("invalid")) {
    return res.status(400).json({ message, type: "validation_error" })
  }

  return res.status(500).json({
    message: `${context} failed`,
    error: appConfig.isDevelopment ? message : undefined,
  })
}
