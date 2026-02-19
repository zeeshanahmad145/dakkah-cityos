import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

/**
 * Tenant Admin: List Stores in Current Tenant
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenantId = req.scope.resolve("adminTenantId")
    
    if (!tenantId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Tenant context required",
      })
    }

    const storeModuleService: any = req.scope.resolve("storeModuleService")
    
    const { status, store_type, limit = 50, offset = 0 } = req.query

    // Build filters
    const filters: any = { tenant_id: tenantId }
    if (status) filters.status = status
    if (store_type) filters.store_type = store_type

    const result: any = await storeModuleService.listAndCountStores(filters, {
      take: Number(limit),
      skip: Number(offset),
    })
    const [stores, count] = result

    res.json({
      stores,
      count,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "ADMIN-TENANT-STORES")}
}

/**
 * Tenant Admin: Create Store
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const tenantId = req.scope.resolve("adminTenantId")
    
    if (!tenantId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Tenant context required",
      })
    }

    const createStoreSchema = z.object({
      handle: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Handle must contain only lowercase letters, numbers, and hyphens"),
      name: z.string().min(1).max(200),
      store_type: z.enum(["retail", "marketplace", "b2b", "subscription", "hybrid"]),
      subdomain: z.string().optional(),
      custom_domain: z.string().optional(),
      storefront_url: z.string().url("Must be a valid URL").optional(),
      theme_config: z.record(z.string(), z.any()).optional(),
      settings: z.record(z.string(), z.any()).optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    }).passthrough()

    const parsed = createStoreSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }
    const validatedData = parsed.data

    const storeModuleService: any = req.scope.resolve("storeModuleService")
    const salesChannelService: any = req.scope.resolve("salesChannelModuleService")

    // Check handle uniqueness
    const existing = await storeModuleService.retrieveStoreByHandle(validatedData.handle)
    if (existing) {
      return res.status(409).json({
        error: "Conflict",
        message: "Store handle already exists",
      })
    }

    // Create sales channel for this store
    const salesChannel = await salesChannelService.createSalesChannels({
      name: validatedData.name,
      description: `Sales channel for ${validatedData.name}`,
      is_disabled: false,
    })

    // Create store
    const store = await storeModuleService.createStores({
      ...validatedData,
      tenant_id: tenantId,
      sales_channel_id: salesChannel.id,
      status: "inactive", // Require explicit activation
    })

    res.status(201).json({ store })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return handleApiError(res, error, "ADMIN-TENANT-STORES")
    }
    
    handleApiError(res, error, "ADMIN-TENANT-STORES")
  }
}

