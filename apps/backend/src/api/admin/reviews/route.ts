import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { handleApiError } from "../../../lib/api-error-handler"

// GET /admin/reviews - List all reviews
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any
  
    const { is_approved, product_id, vendor_id, rating, limit = "50", offset = "0" } = req.query
  
    const filters: Record<string, unknown> = {}
    if (is_approved !== undefined) filters.is_approved = is_approved === "true"
    if (product_id) filters.product_id = product_id
    if (vendor_id) filters.vendor_id = vendor_id
    if (rating) filters.rating = parseInt(rating as string)
  
    const { data: reviews } = await query.graph({
      entity: "review",
      fields: [
        "id", "rating", "title", "content", "customer_id", "customer_name",
        "customer_email", "product_id", "vendor_id", "order_id",
        "is_verified_purchase", "is_approved", "helpful_count", "images",
        "metadata", "created_at", "updated_at"
      ],
      filters,
      pagination: {
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      },
    })
  
    // Enrich with product info
    const enrichedReviews = await Promise.all(reviews.map(async (review: Record<string, unknown>) => {
      let product = null
    
      if (review.product_id) {
        const { data: products } = await query.graph({
          entity: "product",
          fields: ["id", "title", "thumbnail"],
          filters: { id: review.product_id },
        })
        product = products[0] || null
      }
    
      return { ...review, product }
    }))
  
    res.json({ reviews: enrichedReviews })

  } catch (error: unknown) {
    handleApiError(res, error, "GET admin reviews")}
}

