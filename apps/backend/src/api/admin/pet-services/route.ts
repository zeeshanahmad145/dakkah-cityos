import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createSchema = z.object({
  tenant_id: z.string(),
  owner_id: z.string(),
  name: z.string(),
  species: z.enum(["dog", "cat", "bird", "fish", "reptile", "rabbit", "hamster", "other"]),
  breed: z.string().optional(),
  date_of_birth: z.string().optional(),
  weight_kg: z.number().optional(),
  color: z.string().optional(),
  gender: z.enum(["male", "female", "unknown"]).optional(),
  is_neutered: z.boolean().optional(),
  microchip_id: z.string().optional(),
  medical_notes: z.string().optional(),
  allergies: z.any().optional(),
  vaccinations: z.any().optional(),
  photo_url: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("petService") as any
    const { limit = "20", offset = "0" } = req.query as Record<string, string | undefined>
    const items = await mod.listPetProfiles({}, { skip: Number(offset), take: Number(limit) })
    return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })

  } catch (error: any) {
    handleApiError(res, error, "GET admin pet-services")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("petService") as any
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    const item = await mod.createPetProfiles(parsed.data)
    return res.status(201).json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin pet-services")}
}

