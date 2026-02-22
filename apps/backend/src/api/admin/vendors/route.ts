/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { createVendorWorkflow } from "../../../workflows/vendor/create-vendor-workflow"
import { handleApiError } from "../../../lib/api-error-handler"

const createVendorSchema = z.object({
  handle: z.string().min(2),
  businessName: z.string().min(2),
  legalName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string().optional(),
    postalCode: z.string(),
    countryCode: z.string(),
  }),
  commissionRate: z.number().min(0).max(100).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

interface CityOSContext {
  tenantId?: string
  storeId?: string
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorModule = req.scope.resolve("vendor") as any
  const context = (req as any).cityosContext as CityOSContext | undefined

  if (!context?.tenantId) {
    return res.status(403).json({ message: "Tenant context required" })
  }

  const { limit = "20", offset = "0" } = req.query as Record<string, string | undefined>

  const vendors = await vendorModule.listVendors(
    {
      tenant_id: context.tenantId,
      ...(context.storeId && { store_id: context.storeId }),
    },
    {
      skip: Number(offset),
      take: Number(limit),
    }
  )

  return res.json({
    vendors,
    count: Array.isArray(vendors) ? vendors.length : 0,
    limit: Number(limit),
    offset: Number(offset),
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const context = (req as any).cityosContext as CityOSContext | undefined

  if (!context?.tenantId) {
    return res.status(403).json({ message: "Tenant context required" })
  }

  const validation = createVendorSchema.safeParse(req.body)
  
  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.issues,
    })
  }

  const { result } = await createVendorWorkflow(req.scope).run({
    input: {
      tenantId: context.tenantId,
      storeId: context.storeId,
      ...validation.data,
    } as any,
  })

  return res.status(201).json({ vendor: result.vendor })
}

