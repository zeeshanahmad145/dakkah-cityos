import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createAffiliateSchema = z.object({
  tenant_id: z.string().min(1),
  customer_id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().min(1),
  affiliate_type: z.enum(["standard", "influencer", "partner", "ambassador"]),
  status: z.enum(["pending", "approved", "active", "suspended", "terminated"]).optional(),
  commission_rate: z.number(),
  commission_type: z.enum(["percentage", "flat"]).optional(),
  payout_method: z.enum(["bank_transfer", "paypal", "store_credit"]).optional(),
  payout_minimum: z.number().optional(),
  bio: z.string().optional(),
  social_links: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("affiliate") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      status,
      category,
      commission_type,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (status) filters.status = status
    if (category) filters.category = category
    if (commission_type) filters.commission_type = commission_type
    if (search) filters.search = search

    const items = await mod.listAffiliates(filters, { skip: Number(offset), take: Number(limit) })
    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-AFFILIATE")
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createAffiliateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("affiliate") as any
    const item = await mod.createAffiliates(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-AFFILIATE")
  }
}
