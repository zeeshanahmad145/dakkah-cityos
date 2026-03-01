import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { VERTICAL_TEMPLATES } from "../../../../lib/platform/cms-registry"
import { handleApiError } from "../../../../lib/api-error-handler"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { limit: limitStr, page: pageStr } = req.query as Record<string, string>

    const limit = limitStr ? parseInt(limitStr, 10) : 50
    const page = pageStr ? parseInt(pageStr, 10) : 1

    if (isNaN(limit) || isNaN(page) || limit < 1 || page < 1) {
      return res.status(400).json({
        errors: [{ message: "Invalid limit or page parameter" }],
      })
    }

    const totalDocs = VERTICAL_TEMPLATES.length
    const totalPages = Math.max(1, Math.ceil(totalDocs / limit))
    const start = (page - 1) * limit
    const docs = VERTICAL_TEMPLATES.slice(start, start + limit)
    const pagingCounter = (page - 1) * limit + 1

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300")
    return res.status(200).json({
      docs,
      totalDocs,
      limit,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      pagingCounter,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < totalPages ? page + 1 : null,
    })
  } catch (error: unknown) {
return handleApiError(res, error, "PLATFORM-CMS-VERTICALS")
  }
}

