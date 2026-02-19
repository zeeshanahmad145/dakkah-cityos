// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const cartExtensionSchema = z.object({
  cart_id: z.string().min(1),
  action: z.enum(["apply_bundle_discounts", "validate_limits"]).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cartExtensionService = req.scope.resolve("cartExtension")

  const { cart_id } = req.query as { cart_id?: string }

  if (!cart_id) {
    return res.status(400).json({ message: "cart_id query parameter is required" })
  }

  try {
    const insights = await cartExtensionService.calculateCartInsights(cart_id)

    res.json({ insights })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-CART-EXTENSION")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cartExtensionService = req.scope.resolve("cartExtension")

  const parsed = cartExtensionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  const { cart_id, action } = parsed.data

  try {
    if (action === "apply_bundle_discounts") {
      const result = await cartExtensionService.applyBundleDiscounts(cart_id)
      return res.json({ bundle_discounts: result })
    }

    if (action === "validate_limits") {
      const tenantId = (req.query as any)?.tenant_id || ""
      const result = await cartExtensionService.validateCartLimits(cart_id, tenantId)
      return res.json({ validation: result })
    }

    const result = await cartExtensionService.applyBundleDiscounts(cart_id)
    res.json({ bundle_discounts: result })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-CART-EXTENSION")}
}
