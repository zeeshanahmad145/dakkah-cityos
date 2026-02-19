import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const rejectVendorSchema = z.object({
  reason: z.string().optional(),
}).passthrough()

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = rejectVendorSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const vendorModuleService = req.scope.resolve("vendorModuleService") as any
    const { id } = req.params
    const reason = parsed.data.reason || "No reason provided"
  
    const vendor = await vendorModuleService.rejectVendor(id, reason)
  
    res.json({ vendor })

  } catch (error: any) {
    handleApiError(res, error, "POST admin vendors id reject")}
}

