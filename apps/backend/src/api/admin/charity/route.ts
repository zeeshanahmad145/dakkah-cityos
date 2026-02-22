import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createSchema = z.object({
  tenant_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  registration_number: z.string().optional(),
  category: z.enum(["education", "health", "environment", "poverty", "disaster", "animal", "arts", "community", "other"]),
  website: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.any().optional(),
  logo_url: z.string().optional(),
  is_verified: z.boolean().optional(),
  tax_deductible: z.boolean().optional(),
  total_raised: z.number().optional(),
  currency_code: z.string().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("charity") as any
    const { limit = "20", offset = "0" } = req.query as Record<string, string | undefined>
    const items = await mod.listCharityOrgs({}, { skip: Number(offset), take: Number(limit) })
    return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })

  } catch (error: any) {
    handleApiError(res, error, "GET admin charity")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("charity") as any
    const validation = createSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await mod.createCharityOrgs(validation.data)
    return res.status(201).json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin charity")}
}

