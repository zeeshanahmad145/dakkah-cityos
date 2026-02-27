import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const analyticsService = req.scope.resolve("analytics") as any
    const customerId = (req as any).auth_context?.actor_id

    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const { event_type, limit = "20", offset = "0" } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {
      customer_id: customerId,
    }

    if (event_type) {
      filters.event_type = event_type
    }

    const events = await analyticsService.listAnalyticsEvents(filters, {
      take: Number(limit),
      skip: Number(offset),
      order: { created_at: "DESC" },
    })

    const items = Array.isArray(events) ? events : [events].filter(Boolean)

    return res.json({
      items,
      count: items.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    if (error?.message?.includes("does not exist") || error?.message?.includes("relation")) {
      return res.json({
        items: [],
        count: 0,
        limit: Number(req.query.limit || 20),
        offset: Number(req.query.offset || 0),
      })
    }
    handleApiError(res, error, "STORE-ANALYTICS")
  }
}

