import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const createProgramSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  tenant_id: z.string().optional(),
  status: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("loyalty") as any
    const programs = await service.listLoyaltyPrograms({})
    res.json({ programs: Array.isArray(programs) ? programs : [programs].filter(Boolean) })
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-LOYALTY-PROGRAMS")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("loyalty") as any
    const parsed = createProgramSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }
    const program = await service.createLoyaltyPrograms(parsed.data)
    res.status(201).json({ program })
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-LOYALTY-PROGRAMS")}
}

