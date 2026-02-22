// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const reinstateVendorSchema = z.object({
  reason: z.string().optional(),
  notify_vendor: z.boolean().optional(),
}).passthrough()

// POST - Reinstate suspended vendor
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const parsed = reinstateVendorSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const { id } = req.params
    const { reason, notify_vendor } = parsed.data

    const query = req.scope.resolve("query")
    const vendorService = req.scope.resolve("vendorModuleService")

    const { data: vendors } = await query.graph({
      entity: "vendors",
      fields: ["id", "name", "email", "status", "suspended_at", "suspension_reason"],
      filters: { id }
    })

    if (!vendors.length) {
      return res.status(404).json({ message: "Vendor not found" })
    }

    const vendor = vendors[0]

    if (vendor.status !== "suspended") {
      return res.status(400).json({ 
        message: `Vendor is not suspended. Current status: ${vendor.status}` 
      })
    }

    // Reinstate vendor
    await vendorService.updateVendors({
      selector: { id },
      data: {
        status: "approved",
        suspended_at: null,
        suspension_reason: null,
        reinstated_at: new Date(),
        reinstatement_reason: reason
      }
    })

    // Notify vendor if requested
    if (notify_vendor) {
      // TODO: Send reinstatement notification email
    }

    res.json({
      message: "Vendor reinstated successfully",
      vendor_id: id,
      previous_status: "suspended",
      new_status: "approved",
      reinstated_at: new Date()
    })

  } catch (error: any) {
    handleApiError(res, error, "POST admin vendors id reinstate")}
}

