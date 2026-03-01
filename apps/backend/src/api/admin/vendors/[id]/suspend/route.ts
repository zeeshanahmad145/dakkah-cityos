// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const suspendVendorSchema = z.object({
  reason: z.string().optional(),
}).passthrough()

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = suspendVendorSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  const { id } = req.params
  const { reason } = parsed.data
  const vendorService = req.scope.resolve("vendor") as unknown as any
  const eventBus = req.scope.resolve("event_bus") as unknown as any
  
  try {
    const vendor = await vendorService.updateVendors({
      id,
      status: "suspended",
      suspended_at: new Date(),
      suspended_by: req.auth_context?.actor_id,
      suspension_reason: reason,
      metadata: {
        suspension_reason: reason,
        suspended_at: new Date().toISOString()
      }
    })
    
    await eventBus.emit("vendor.suspended", { id, reason })
    
    res.json({ vendor })
  } catch (error: unknown) {
    handleApiError(res, error, "ADMIN-VENDORS-ID-SUSPEND")}
}

