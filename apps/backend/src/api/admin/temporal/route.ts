import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { checkTemporalHealth } from "../../../lib/temporal-client"
import { handleApiError } from "../../../lib/api-error-handler"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const health = await checkTemporalHealth()
    return res.json(health)

  } catch (error: unknown) {
    handleApiError(res, error, "GET admin temporal")}
}

