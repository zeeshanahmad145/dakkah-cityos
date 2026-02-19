import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  code: z.string().nullable().optional(),
  type: z.enum(["region", "country", "authority"]),
  jurisdiction_level: z.number().optional(),
  parent_authority_id: z.string().nullable().optional(),
  country_id: z.string().nullable().optional(),
  region_id: z.string().nullable().optional(),
  residency_zone: z.enum(["GCC", "EU", "MENA", "APAC", "AMERICAS", "GLOBAL"]).nullable().optional(),
  policies: z.any().nullable().optional(),
  tenant_id: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const moduleService = req.scope.resolve("governance") as any
  const { limit = "20", offset = "0", tenant_id, type } = req.query as Record<string, string | undefined>
  const filters: Record<string, any> = {}
  if (tenant_id) filters.tenant_id = tenant_id
  if (type) filters.type = type
  const items = await moduleService.listGovernanceAuthorities(filters, { skip: Number(offset), take: Number(limit) })
  return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const moduleService = req.scope.resolve("governance") as any
  const validation = createSchema.safeParse(req.body)
  if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
  const item = await moduleService.createGovernanceAuthoritys(validation.data)
  return res.status(201).json({ item })
}

