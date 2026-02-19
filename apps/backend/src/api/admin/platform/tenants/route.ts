import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

/**
 * Platform Admin: List All Tenants
 * Only accessible by super_admin role
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Verify super admin
    const authContext = (req as any).auth_context
    const userRole = authContext?.app_metadata?.role
    if (userRole !== "super_admin") {
      return res.status(403).json({
        error: "Forbidden",
        message: "Only super admins can access this endpoint",
      })
    }

    const tenantModuleService: any = req.scope.resolve("tenantModuleService")
    
    // Get query parameters
    const { country_id, scope_type, scope_id, category_id, status, limit = 50, offset = 0 } = req.query

    // Build filters
    const filters: any = {}
    if (country_id) filters.country_id = country_id
    if (scope_type) filters.scope_type = scope_type
    if (scope_id) filters.scope_id = scope_id
    if (category_id) filters.category_id = category_id
    if (status) filters.status = status

    // List tenants
    const result: any = await tenantModuleService.listAndCountTenants(filters, {
      take: Number(limit),
      skip: Number(offset),
      relations: [], // Add relations as needed
    })
    const [tenants, count] = result

    res.json({
      tenants,
      count,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "ADMIN-PLATFORM-TENANTS")}
}

/**
 * Platform Admin: Create Tenant
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Verify super admin
    const authContext = (req as any).auth_context
    const userRole = authContext?.app_metadata?.role
    if (userRole !== "super_admin") {
      return res.status(403).json({
        error: "Forbidden",
        message: "Only super admins can create tenants",
      })
    }

    // Validate request body
    const createTenantSchema = z.object({
      handle: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Handle must contain only lowercase letters, numbers, and hyphens"),
      name: z.string().min(1).max(200),
      country_id: z.string().min(2).max(2),
      scope_type: z.enum(["theme", "city"]),
      scope_id: z.string(),
      category_id: z.string(),
      subcategory_id: z.string().optional(),
      billing_email: z.string().email(),
      subscription_tier: z.enum(["basic", "pro", "enterprise", "custom"]).default("basic"),
      subdomain: z.string().optional(),
      custom_domain: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    }).passthrough()

    const parsed = createTenantSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }
    const validatedData = parsed.data

    const tenantModuleService: any = req.scope.resolve("tenantModuleService")

    // Check handle uniqueness
    const existing = await tenantModuleService.retrieveTenantByHandle(validatedData.handle)
    if (existing) {
      return res.status(409).json({
        error: "Conflict",
        message: "Tenant handle already exists",
      })
    }

    // Create tenant
    const tenant = await tenantModuleService.createTenants({
      ...validatedData,
      status: "trial",
      trial_starts_at: new Date(),
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    })

    res.status(201).json({ tenant })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return handleApiError(res, error, "ADMIN-PLATFORM-TENANTS")
    }
    
    handleApiError(res, error, "ADMIN-PLATFORM-TENANTS")
  }
}

