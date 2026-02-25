import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("subscription") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      status,
      billing_interval,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (status) filters.status = status
    if (billing_interval) filters.billing_interval = billing_interval

    const plans = await mod.listSubscriptionPlans(filters, {
      skip: Number(offset),
      take: Number(limit),
    })

    const items = Array.isArray(plans) ? plans : []

    if (search) {
      const q = search.toLowerCase()
      const filtered = items.filter((p: any) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      )
      return res.json({
        subscriptions: filtered,
        count: filtered.length,
        limit: Number(limit),
        offset: Number(offset),
      })
    }

    return res.json({
      subscriptions: items,
      count: items.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-SUBSCRIPTIONS")
  }
}
