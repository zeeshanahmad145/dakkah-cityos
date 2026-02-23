import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getLocalCMSNavigation } from "../../../../lib/platform/cms-registry"
import { handleApiError } from "../../../../lib/api-error-handler"
import { appConfig } from "../../../../lib/config"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { tenant_id, location, locale } = req.query as Record<string, string>

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required query parameter: tenant_id",
        errors: [{ message: "Missing required query parameter: tenant_id" }],
      })
    }

    const localNav = getLocalCMSNavigation(tenant_id, location || "header")
    if (localNav) {
      const docs = [localNav]
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300")
      return res.status(200).json({
        success: true,
        data: {
          navigations: docs,
          total: 1,
          source: "local-registry",
        },
        docs,
        totalDocs: 1,
        limit: 10,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        pagingCounter: 1,
        prevPage: null,
        nextPage: null,
      })
    }

    const payloadUrl = appConfig.payloadCms.url

    const where: Record<string, any> = {
      tenant: { equals: tenant_id },
      _status: { equals: "published" },
    }

    if (location) {
      where.location = { equals: location }
    }

    if (locale) {
      where.locale = { equals: locale }
    }

    const query = new URLSearchParams({
      where: JSON.stringify(where),
      limit: "10",
      depth: "3",
    })

    try {
      const payloadApiKey = appConfig.payloadCms.apiKey
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (payloadApiKey) {
        headers["Authorization"] = `Bearer ${payloadApiKey}`
      }

      const response = await fetch(`${payloadUrl}/api/navigations?${query}`, { headers })

      if (!response.ok) {
        return res.status(200).json({
          success: true,
          data: { navigations: [], source: "payload" },
          docs: [],
          totalDocs: 0,
          limit: 10,
          page: 1,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          pagingCounter: 1,
          prevPage: null,
          nextPage: null,
        })
      }

      const data = await response.json()
      const docs = data.docs || []

      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300")

      return res.status(200).json({
        success: true,
        data: {
          navigations: docs,
          total: data.totalDocs || 0,
          source: "payload",
        },
        docs,
        totalDocs: data.totalDocs || 0,
        limit: data.limit || 10,
        page: data.page || 1,
        totalPages: data.totalPages || 0,
        hasNextPage: data.hasNextPage || false,
        hasPrevPage: data.hasPrevPage || false,
        pagingCounter: data.pagingCounter || 1,
        prevPage: data.prevPage || null,
        nextPage: data.nextPage || null,
      })
    } catch {
      return res.status(200).json({
        success: true,
        data: { navigations: [], source: "payload", error: "Payload CMS unavailable" },
        docs: [],
        totalDocs: 0,
        limit: 10,
        page: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        pagingCounter: 1,
        prevPage: null,
        nextPage: null,
      })
    }
  } catch (error: any) {
return handleApiError(res, error, "PLATFORM-CMS-NAVIGATION")
  }
}

