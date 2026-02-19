import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  storage_type: z.enum(["ambient", "chilled", "frozen", "live"]).optional(),
  shelf_life_days: z.number().optional(),
  optimal_temp_min: z.number().optional(),
  optimal_temp_max: z.number().optional(),
  origin_country: z.string().optional(),
  organic: z.boolean().optional(),
  unit_type: z.enum(["piece", "kg", "gram", "liter", "bunch", "pack"]).optional(),
  min_order_quantity: z.number().optional(),
  is_seasonal: z.boolean().optional(),
  season_start: z.string().optional(),
  season_end: z.string().optional(),
  nutrition_info: z.any().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("grocery") as any
  const { id } = req.params
  const [item] = await mod.listFreshProducts({ id }, { take: 1 })
  if (!item) return res.status(404).json({ message: "Not found" })
  return res.json({ item })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("grocery") as any
  const { id } = req.params
  const validation = updateSchema.safeParse(req.body)
  if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
  const item = await mod.updateFreshProducts({ id, ...validation.data })
  return res.json({ item })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("grocery") as any
  const { id } = req.params
  await mod.deleteFreshProducts([id])
  return res.status(204).send()
}

