import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createSchema = z.object({
  tenant_id: z.string(),
  customer_id: z.string(),
  facility_id: z.string().optional(),
  membership_type: z.enum(["basic", "premium", "vip", "student", "corporate", "family"]),
  status: z.enum(["active", "frozen", "expired", "cancelled"]).optional(),
  start_date: z.string(),
  end_date: z.string().optional(),
  monthly_fee: z.number(),
  currency_code: z.string(),
  auto_renew: z.boolean().optional(),
  freeze_count: z.number().optional(),
  max_freezes: z.number().optional(),
  access_hours: z.any().optional(),
  includes: z.any().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("fitness") as any
    const { limit = "20", offset = "0" } = req.query as Record<string, string | undefined>
    const items = await mod.listGymMemberships({}, { skip: Number(offset), take: Number(limit) })
    return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })

  } catch (error: any) {
    handleApiError(res, error, "GET admin fitness")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("fitness") as any
    const validation = createSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await mod.createGymMemberships(validation.data)
    return res.status(201).json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin fitness")}
}

