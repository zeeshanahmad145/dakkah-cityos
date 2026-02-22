import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  name: z.string().optional(),
  species: z.enum(["dog", "cat", "bird", "fish", "reptile", "rabbit", "hamster", "other"]).optional(),
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
    const { id } = req.params
    const [item] = await mod.listPetProfiles({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin pet-services id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("petService") as any
    const { id } = req.params
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    const item = await mod.updatePetProfiles({ id, ...parsed.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin pet-services id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("petService") as any
    const { id } = req.params
    await mod.deletePetProfiles([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin pet-services id")}
}

