import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const updateProgramSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  tenant_id: z.string().optional(),
  status: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("loyalty") as any
    const program = await service.retrieveLoyaltyProgram(req.params.id)
    res.json({ program })
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-LOYALTY-PROGRAMS-ID")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("loyalty") as any
    const parsed = updateProgramSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }
    const program = await service.updateLoyaltyPrograms(req.params.id, parsed.data)
    res.json({ program })
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-LOYALTY-PROGRAMS-ID")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("loyalty") as any
    await service.deleteLoyaltyPrograms(req.params.id)
    res.status(200).json({ id: req.params.id, deleted: true })
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-LOYALTY-PROGRAMS-ID")}
}

