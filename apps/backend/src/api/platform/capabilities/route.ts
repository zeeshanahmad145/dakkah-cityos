import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PLATFORM_CAPABILITIES } from "../../../lib/platform/index"
import { handleApiError } from "../../../lib/api-error-handler"

export const AUTHENTICATE = false

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  try {
    return res.json({
      success: true,
      data: PLATFORM_CAPABILITIES,
    })

  } catch (error: unknown) {
    handleApiError(res, error, "GET platform capabilities")}
}

