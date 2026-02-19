import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const resolveSchema = z.object({
  resolution: z.string().optional(),
  resolution_amount: z.number().optional(),
  resolved_by: z.string().optional(),
  notes: z.string().optional(),
}).passthrough()

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("dispute") as any
    const parsed = resolveSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    const dispute = await service.resolve({
      disputeId: req.params.id,
      resolution: parsed.data?.resolution,
      resolutionAmount: parsed.data?.resolution_amount,
      resolvedBy: parsed.data?.resolved_by || "admin",
      notes: parsed.data?.notes,
    })
    res.json({ dispute })
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-DISPUTES-ID-RESOLVE")}
}

