import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const escalateSchema = z.object({
  reason: z.string().optional(),
}).passthrough()

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("dispute") as any
    const parsed = escalateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    const dispute = await service.escalate(req.params.id, parsed.data?.reason)
    res.json({ dispute })
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-DISPUTES-ID-ESCALATE")}
}

