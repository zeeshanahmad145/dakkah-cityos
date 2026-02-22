/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createSubscriptionSchema = z.object({
  customer_id: z.string(),
  plan_id: z.string(),
  status: z.enum(["active", "trialing", "paused"]).optional().default("active"),
  trial_ends_at: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict()

interface CityOSContext {
  tenantId?: string
  storeId?: string
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const subscriptionModule = req.scope.resolve("subscription") as any
    const cityosContext = (req as any).cityosContext as CityOSContext | undefined

    const filters: any = {}
    if (cityosContext?.tenantId && cityosContext.tenantId !== "default") {
      filters.tenant_id = cityosContext.tenantId
    }

    const { status, customer_id, plan_id } = req.query as Record<string, string | undefined>
    if (status) filters.status = status
    if (customer_id) filters.customer_id = customer_id
    if (plan_id) filters.plan_id = plan_id

    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0

    const subscriptions = await subscriptionModule.listSubscriptions(filters, { skip: offset, take: limit })

    res.json({
      subscriptions,
      count: Array.isArray(subscriptions) ? subscriptions.length : 0,
      limit,
      offset,
    })
  } catch (error) {
    handleApiError(res, error, "GET admin subscriptions")
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = createSubscriptionSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const subscriptionModule = req.scope.resolve("subscription") as any
    const cityosContext = (req as any).cityosContext as CityOSContext | undefined

    const subscription = await subscriptionModule.createSubscriptions({
      ...parsed.data,
      tenant_id: cityosContext?.tenantId || "default",
    })

    res.status(201).json({ subscription })
  } catch (error) {
    handleApiError(res, error, "POST admin subscriptions")
  }
}
