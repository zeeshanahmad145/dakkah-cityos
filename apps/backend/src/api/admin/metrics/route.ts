import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { metrics } from "../../../lib/monitoring/metrics"
import { handleApiError } from "../../../lib/api-error-handler"

/**
 * Prometheus-compatible metrics endpoint
 * 
 * Returns metrics in Prometheus text format for scraping
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const accept = req.headers.accept || ""
  
    if (accept.includes("application/json")) {
      // JSON format for debugging
      return res.json(metrics.getSummary())
    }

    // Prometheus text format
    res.setHeader("Content-Type", "text/plain; charset=utf-8")
    return res.send(metrics.exportPrometheus())

  } catch (error: unknown) {
    handleApiError(res, error, "GET admin metrics")}
}

