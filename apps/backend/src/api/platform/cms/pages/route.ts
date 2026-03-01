import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { queryPages } from "../../../../lib/platform/cms-registry"
import { handleApiError } from "../../../../lib/api-error-handler"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { where: whereStr, limit: limitStr, page: pageStr, sort, depth } = req.query as Record<string, string>

    let where: Record<string, any> | undefined
    if (whereStr) {
      try {
        where = JSON.parse(whereStr)
      } catch {
        return res.status(400).json({
          errors: [{ message: "Invalid JSON in 'where' parameter" }],
        })
      }
    }

    const limit = limitStr ? parseInt(limitStr, 10) : 10
    const page = pageStr ? parseInt(pageStr, 10) : 1

    if (isNaN(limit) || isNaN(page) || limit < 1 || page < 1) {
      return res.status(400).json({
        errors: [{ message: "Invalid limit or page parameter" }],
      })
    }

    const result = queryPages({ where, limit, page, sort })

    const pagingCounter = (result.page - 1) * result.limit + 1

    res.setHeader("Cache-Control", "public, max-age=30, s-maxage=120")
    return res.status(200).json({
      ...result,
      pagingCounter,
      prevPage: result.hasPrevPage ? result.page - 1 : null,
      nextPage: result.hasNextPage ? result.page + 1 : null,
    })
  } catch (error: unknown) {
return handleApiError(res, error, "PLATFORM-CMS-PAGES")
  }
}

