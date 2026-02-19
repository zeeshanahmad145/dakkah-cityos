import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createSchema = z.object({
  residency_zone: z.enum(["GCC", "EU", "MENA", "APAC", "AMERICAS", "GLOBAL"]),
  medusa_region_id: z.string(),
  country_codes: z.any().optional(),
  policies_override: z.any().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("regionZone") as any
  const { limit = "20", offset = "0" } = req.query as Record<string, string | undefined>
  const items = await mod.listRegionZoneMappings({}, { skip: Number(offset), take: Number(limit) })
  return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("regionZone") as any
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  const item = await mod.createRegionZoneMappings(parsed.data)
  return res.status(201).json({ item })
}

