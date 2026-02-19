import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

/**
 * Platform Admin: Get Tenant by ID
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const authContext = (req as any).auth_context
    const userRole = authContext?.app_metadata?.role
    if (userRole !== "super_admin") {
      return res.status(403).json({
        error: "Forbidden",
        message: "Only super admins can access this endpoint",
      })
    }

    const tenantModuleService: any = req.scope.resolve("tenantModuleService")
    const { id } = req.params

    const tenant = await tenantModuleService.retrieveTenant(id)

    if (!tenant) {
      return res.status(404).json({
        error: "Not Found",
        message: "Tenant not found",
      })
    }

    res.json({ tenant })
  } catch (error: any) {
    handleApiError(res, error, "ADMIN-PLATFORM-TENANTS-ID")}
}

/**
 * Platform Admin: Update Tenant
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const authContext = (req as any).auth_context
    const userRole = authContext?.app_metadata?.role
    if (userRole !== "super_admin") {
      return res.status(403).json({
        error: "Forbidden",
        message: "Only super admins can update tenants",
      })
    }

    const updateTenantSchema = z.object({
      name: z.string().min(1).max(200).optional(),
      status: z.enum(["active", "suspended", "trial", "inactive"]).optional(),
      subscription_tier: z.enum(["basic", "pro", "enterprise", "custom"]).optional(),
      billing_email: z.string().email("Must be a valid email").optional(),
      subdomain: z.string().optional(),
      custom_domain: z.string().optional(),
      logo_url: z.string().url("Must be a valid URL").optional(),
      settings: z.record(z.string(), z.any()).optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    }).passthrough()

    const parsed = updateTenantSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }
    const validatedData = parsed.data

    const tenantModuleService: any = req.scope.resolve("tenantModuleService")
    const { id } = req.params

    const tenant = await tenantModuleService.updateTenants({
      id,
      ...validatedData
    })

    res.json({ tenant })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return handleApiError(res, error, "ADMIN-PLATFORM-TENANTS-ID")
    }
    
    handleApiError(res, error, "ADMIN-PLATFORM-TENANTS-ID")
  }
}

/**
 * Platform Admin: Delete Tenant
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const authContext = (req as any).auth_context
    const userRole = authContext?.app_metadata?.role
    if (userRole !== "super_admin") {
      return res.status(403).json({
        error: "Forbidden",
        message: "Only super admins can delete tenants",
      })
    }

    const tenantModuleService: any = req.scope.resolve("tenantModuleService")
    const { id } = req.params

    await tenantModuleService.softDeleteTenants([id])

    res.status(204).send()
  } catch (error: any) {
    handleApiError(res, error, "ADMIN-PLATFORM-TENANTS-ID")}
}

