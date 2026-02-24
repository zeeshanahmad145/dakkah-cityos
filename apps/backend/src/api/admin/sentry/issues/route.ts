import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { appConfig } from "../../../../lib/config"
import { handleApiError } from "../../../../lib/api-error-handler"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    if (!appConfig.sentry.isApiConfigured) {
      const dsnMatch = appConfig.sentry.dsn.match(
        /https:\/\/([^@]+)@([^/]+)\/(\d+)/
      )

      if (!dsnMatch) {
        return res.status(400).json({
          success: false,
          error: "Sentry not configured. Set SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT or at minimum SENTRY_DSN",
        })
      }

      return res.status(400).json({
        success: false,
        error: "Sentry API not fully configured. Set SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT environment variables to read issues via API.",
        sentryConfigured: appConfig.sentry.isConfigured,
        hint: "You can generate an auth token at https://sentry.io/settings/auth-tokens/",
      })
    }

    const query = req.query.query as string || "is:unresolved"
    const limit = parseInt((req.query.limit as string) || "25")
    const cursor = req.query.cursor as string || ""
    const sort = req.query.sort as string || "date"

    const baseUrl = `https://sentry.io/api/0/projects/${appConfig.sentry.org}/${appConfig.sentry.project}/issues/`

    const params = new URLSearchParams({
      query,
      limit: String(limit),
      sort,
    })
    if (cursor) {
      params.set("cursor", cursor)
    }

    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${appConfig.sentry.authToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(response.status).json({
        success: false,
        error: `Sentry API returned ${response.status}: ${errorText}`,
      })
    }

    const issues = await response.json()
    const nextCursor = response.headers.get("link")

    return res.json({
      success: true,
      data: {
        issues: issues.map((issue: any) => ({
          id: issue.id,
          title: issue.title,
          culprit: issue.culprit,
          level: issue.level,
          status: issue.status,
          count: issue.count,
          userCount: issue.userCount,
          firstSeen: issue.firstSeen,
          lastSeen: issue.lastSeen,
          permalink: issue.permalink,
          shortId: issue.shortId,
          metadata: issue.metadata,
          type: issue.type,
        })),
        total: issues.length,
        cursor: nextCursor,
        query,
      },
    })
  } catch (error: any) {
    return handleApiError(res, error, "Sentry issues fetch")
  }
}
