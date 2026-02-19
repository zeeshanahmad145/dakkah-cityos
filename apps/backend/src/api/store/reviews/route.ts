import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  content: z.string().min(1),
  product_id: z.string().optional(),
  vendor_id: z.string().optional(),
  order_id: z.string().optional(),
})

// POST /store/reviews - Create a new review
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const reviewService = req.scope.resolve("review")
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const parsed = createReviewSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  const { rating, title, content, product_id, vendor_id, order_id } = parsed.data

  if (!product_id && !vendor_id) {
    return res.status(400).json({ message: "Product ID or Vendor ID is required" })
  }

  try {
    // Check if this is a verified purchase
    let isVerifiedPurchase = false
    if (order_id) {
      const query = req.scope.resolve("query")
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "customer_id"],
        filters: { id: order_id, customer_id: customerId },
      })
      isVerifiedPurchase = orders.length > 0
    }

    // Get customer details
    const query = req.scope.resolve("query")
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["first_name", "last_name", "email"],
      filters: { id: customerId },
    })
    const customer = customers[0]

    const review = await reviewService.createReview({
      rating,
      title,
      content,
      customer_id: customerId,
      customer_name: customer ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim() : undefined,
      customer_email: customer?.email,
      product_id,
      vendor_id,
      order_id,
      is_verified_purchase: isVerifiedPurchase,
    })

    res.status(201).json({ review })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-REVIEWS")}
}

