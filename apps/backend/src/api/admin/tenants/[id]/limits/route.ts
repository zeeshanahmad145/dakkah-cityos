// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const updateLimitsSchema = z.object({
  max_products: z.number().optional(),
  max_orders_per_month: z.number().optional(),
  max_storage_gb: z.number().optional(),
  max_api_calls_per_day: z.number().optional(),
  max_team_members: z.number().optional(),
  max_stores: z.number().optional(),
}).passthrough()

// GET - Get tenant limits
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const query = req.scope.resolve("query")

    const { data: tenants } = await query.graph({
      entity: "tenant",
      fields: [
        "id",
        "name",
        "plan",
        "limits.max_products",
        "limits.max_orders_per_month",
        "limits.max_storage_gb",
        "limits.max_api_calls_per_day",
        "limits.max_team_members",
        "limits.max_stores"
      ],
      filters: { id }
    })

    if (!tenants.length) {
      return res.status(404).json({ message: "Tenant not found" })
    }

    const tenant = tenants[0]

    // Get current usage
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id"],
      filters: { tenant_id: id }
    })

    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id"],
      filters: { 
        tenant_id: id,
        created_at: { $gte: currentMonth.toISOString() }
      }
    })

    const { data: teamMembers } = await query.graph({
      entity: "tenant_user",
      fields: ["id"],
      filters: { tenant_id: id }
    })

    res.json({
      tenant_id: id,
      plan: tenant.plan,
      limits: tenant.limits || {
        max_products: 100,
        max_orders_per_month: 1000,
        max_storage_gb: 5,
        max_api_calls_per_day: 10000,
        max_team_members: 5,
        max_stores: 1
      },
      usage: {
        products: products.length,
        orders_this_month: orders.length,
        team_members: teamMembers.length,
        storage_gb: 0 // Would need file storage tracking
      }
    })

  } catch (error: any) {
    handleApiError(res, error, "GET admin tenants id limits")}
}

// PUT - Update tenant limits
export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const parsed = updateLimitsSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }
    const {
      max_products,
      max_orders_per_month,
      max_storage_gb,
      max_api_calls_per_day,
      max_team_members,
      max_stores
    } = parsed.data

    const tenantService = req.scope.resolve("tenantModuleService")
    const query = req.scope.resolve("query")

    // Get current limits
    const { data: tenants } = await query.graph({
      entity: "tenant",
      fields: ["id", "limits"],
      filters: { id }
    })

    if (!tenants.length) {
      return res.status(404).json({ message: "Tenant not found" })
    }

    const currentLimits = tenants[0].limits || {}

    const newLimits = {
      ...currentLimits,
      ...(max_products !== undefined && { max_products }),
      ...(max_orders_per_month !== undefined && { max_orders_per_month }),
      ...(max_storage_gb !== undefined && { max_storage_gb }),
      ...(max_api_calls_per_day !== undefined && { max_api_calls_per_day }),
      ...(max_team_members !== undefined && { max_team_members }),
      ...(max_stores !== undefined && { max_stores })
    }

    await tenantService.updateTenants({
      selector: { id },
      data: { limits: newLimits }
    })

    res.json({
      message: "Limits updated",
      limits: newLimits
    })

  } catch (error: any) {
    handleApiError(res, error, "PUT admin tenants id limits")}
}

