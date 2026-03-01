// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const updateDiscountSchema = z.object({
  usage_limit: z.number().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  status: z.enum(["active", "disabled"]).optional(),
}).passthrough()

// GET - Get subscription discount by ID
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const query = req.scope.resolve("query") as unknown as any

    const { data: discounts } = await query.graph({
      entity: "subscription_discount",
      fields: [
        "id",
        "code",
        "type",
        "value",
        "plan_id",
        "plan.name",
        "usage_limit",
        "usage_count",
        "valid_from",
        "valid_until",
        "first_payment_only",
        "duration_months",
        "status",
        "created_at",
        "updated_at"
      ],
      filters: { id }
    })

    if (!discounts.length) {
      return res.status(404).json({ message: "Discount not found" })
    }

    res.json({ discount: discounts[0] })

  } catch (error: unknown) {
    handleApiError(res, error, "GET admin subscriptions discounts id")}
}

// PUT - Update subscription discount
export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const parsed = updateDiscountSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }
    const {
      usage_limit,
      valid_from,
      valid_until,
      status
    } = parsed.data

    const subscriptionService = req.scope.resolve("subscription") as unknown as any

    await subscriptionService.updateSubscriptionDiscounts({
      selector: { id },
      data: {
        ...(usage_limit !== undefined && { usage_limit }),
        ...(valid_from && { valid_from: new Date(valid_from) }),
        ...(valid_until && { valid_until: new Date(valid_until) }),
        ...(status && { status })
      }
    })

    const query = req.scope.resolve("query") as unknown as any
    const { data: discounts } = await query.graph({
      entity: "subscription_discount",
      fields: ["id", "code", "type", "value", "usage_limit", "usage_count", "status"],
      filters: { id }
    })

    res.json({ discount: discounts[0] })

  } catch (error: unknown) {
    handleApiError(res, error, "PUT admin subscriptions discounts id")}
}

// DELETE - Delete subscription discount
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const subscriptionService = req.scope.resolve("subscription") as unknown as any

    await subscriptionService.deleteSubscriptionDiscounts(id)

    res.json({ message: "Discount deleted", id })

  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin subscriptions discounts id")}
}

