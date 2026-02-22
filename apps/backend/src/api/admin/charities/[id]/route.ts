import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  registration_number: z.string().optional(),
  category: z.enum(["education", "health", "environment", "poverty", "disaster", "animal", "arts", "community", "other"]).optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.any().optional(),
  logo_url: z.string().optional(),
  is_verified: z.boolean().optional(),
  verified_at: z.string().optional(),
  tax_deductible: z.boolean().optional(),
  total_raised: z.number().optional(),
  currency_code: z.string().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("charity") as any
    const { id } = req.params
    const [item] = await mod.listCharityOrgs({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin charities id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("charity") as any
    const { id } = req.params
    const validation = updateSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await mod.updateCharityOrgs({ id, ...validation.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin charities id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("charity") as any
    const { id } = req.params
    await mod.deleteCharityOrgs([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin charities id")}
}

