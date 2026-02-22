import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createSchema = z.object({
  tenant_id: z.string().min(1),
  customer_id: z.string().min(1),
  tier_id: z.string().min(1),
  membership_number: z.string().min(1),
  status: z.enum(["active", "expired", "suspended", "cancelled"]).optional(),
  joined_at: z.string().min(1),
  expires_at: z.string().nullable().optional(),
  auto_renew: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("membership") as any
    const { limit = "20", offset = "0" } = req.query as Record<string, string | undefined>
    const items = await moduleService.listMemberships({}, { skip: Number(offset), take: Number(limit) })
    return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })

  } catch (error: any) {
    handleApiError(res, error, "GET admin memberships")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("membership") as any
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    const item = await moduleService.createMemberships(parsed.data)
    return res.status(201).json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin memberships")}
}

