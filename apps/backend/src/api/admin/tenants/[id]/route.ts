import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateTenantSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  domain: z.string().optional(),
  status: z.string().optional(),
  plan: z.string().optional(),
  owner_email: z.string().optional(),
  owner_name: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  features: z.record(z.string(), z.unknown()).optional(),
  trial_ends_at: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query")
    const { id } = req.params
  
    const { data: [tenant] } = await query.graph({
      entity: "tenant",
      fields: [
        "id",
        "name",
        "slug",
        "domain",
        "status",
        "plan",
        "owner_email",
        "owner_name",
        "settings",
        "features",
        "trial_ends_at",
        "created_at",
        "updated_at",
        "billing.*",
        "users.*",
      ],
      filters: { id },
    })
  
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" })
    }
  
    res.json({ tenant })

  } catch (error: any) {
    handleApiError(res, error, "GET admin tenants id")}
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenantModuleService = req.scope.resolve("tenantModuleService") as any
    const { id } = req.params
    const parsed = updateTenantSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }
  
    const tenant = await tenantModuleService.updateTenants({ id, ...parsed.data })
  
    res.json({ tenant })

  } catch (error: any) {
    handleApiError(res, error, "PUT admin tenants id")}
}

