/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createInsuranceSchema = z.object({
  customer_id: z.string(),
  policy_type: z.string(),
  coverage_amount: z.number(),
  premium_amount: z.number(),
  start_date: z.string(),
  end_date: z.string(),
  status: z.enum(["active", "pending"]).optional().default("pending"),
}).strict()

interface CityOSContext {
  tenantId?: string
  storeId?: string
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const insuranceModule = req.scope.resolve("insurance") as any
    const cityosContext = (req as any).cityosContext as CityOSContext | undefined

    const filters: any = {}
    if (cityosContext?.tenantId && cityosContext.tenantId !== "default") {
      filters.tenant_id = cityosContext.tenantId
    }

    const { status, customer_id, policy_type } = req.query as Record<string, string | undefined>
    if (status) filters.status = status
    if (customer_id) filters.customer_id = customer_id
    if (policy_type) filters.plan_type = policy_type

    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0

    const policies = await insuranceModule.listInsPolicys(filters, { skip: offset, take: limit })

    res.json({
      policies,
      count: Array.isArray(policies) ? policies.length : 0,
      limit,
      offset,
    })
  } catch (error) {
    handleApiError(res, error, "GET admin insurance")
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = createInsuranceSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const insuranceModule = req.scope.resolve("insurance") as any
    const cityosContext = (req as any).cityosContext as CityOSContext | undefined

    const policy = await insuranceModule.createInsPolicys({
      ...parsed.data,
      plan_type: parsed.data.policy_type,
      premium: parsed.data.premium_amount,
      tenant_id: cityosContext?.tenantId || "default",
    })

    res.status(201).json({ policy })
  } catch (error) {
    handleApiError(res, error, "POST admin insurance")
  }
}
