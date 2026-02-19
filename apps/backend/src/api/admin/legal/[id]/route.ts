import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  name: z.string().optional(),
  bar_number: z.string().optional(),
  specializations: z.any().optional(),
  practice_areas: z.any().optional(),
  bio: z.string().optional(),
  education: z.any().optional(),
  experience_years: z.number().optional(),
  hourly_rate: z.number().optional(),
  currency_code: z.string().optional(),
  is_accepting_cases: z.boolean().optional(),
  rating: z.number().optional(),
  photo_url: z.string().optional(),
  languages: z.any().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("legal") as any
    const { id } = req.params
    const [item] = await mod.listAttorneyProfiles({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin legal id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("legal") as any
    const { id } = req.params
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    const item = await mod.updateAttorneyProfiles({ id, ...parsed.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin legal id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("legal") as any
    const { id } = req.params
    await mod.deleteAttorneyProfiles([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin legal id")}
}

