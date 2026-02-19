import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const rejectSchema = z.object({
  reason: z.string().optional(),
}).passthrough()

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const companyModuleService = req.scope.resolve("companyModuleService") as any
    const { id } = req.params
    const parsed = rejectSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }
    const reason = parsed.data.reason || "No reason provided"
    const userId = (req as any).auth_context?.actor_id || "system"
  
    const purchase_order = await companyModuleService.rejectPurchaseOrder(id, userId, reason)
  
    res.json({ purchase_order })

  } catch (error: any) {
    handleApiError(res, error, "POST admin purchase-orders id reject")}
}

