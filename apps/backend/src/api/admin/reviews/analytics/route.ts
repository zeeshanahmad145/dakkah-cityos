import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

// GET - Review analytics
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { 
      period = "30d",
      product_id,
      vendor_id 
    } = req.query as { 
      period?: string
      product_id?: string
      vendor_id?: string
    }

    const query = req.scope.resolve("query") as unknown as any

    // Calculate date range
    const now = new Date()
    let startDate: Date
    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const filters: Record<string, any> = {
      created_at: { $gte: startDate.toISOString() }
    }
    if (product_id) filters.product_id = product_id
    if (vendor_id) filters.vendor_id = vendor_id

    const { data: reviews } = await query.graph({
      entity: "review",
      fields: ["id", "rating", "status", "verified_purchase", "helpful_count", "created_at", "product_id"],
      filters
    })

    // Calculate analytics
    const totalReviews = reviews.length
    const approvedReviews = reviews.filter((r: any) => r.status === "approved")
    const pendingReviews = reviews.filter((r: any) => r.status === "pending")
    const rejectedReviews = reviews.filter((r: any) => r.status === "rejected")

    const ratings = approvedReviews.map((r: any) => r.rating)
    const averageRating = ratings.length > 0 
      ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length 
      : 0

    const ratingDistribution = {
      5: approvedReviews.filter((r: any) => r.rating === 5).length,
      4: approvedReviews.filter((r: any) => r.rating === 4).length,
      3: approvedReviews.filter((r: any) => r.rating === 3).length,
      2: approvedReviews.filter((r: any) => r.rating === 2).length,
      1: approvedReviews.filter((r: any) => r.rating === 1).length
    }

    const verifiedPurchases = reviews.filter((r: any) => r.verified_purchase).length
    const totalHelpfulVotes = reviews.reduce((sum: number, r: any) => sum + (r.helpful_count || 0), 0)

    // Group by date for trend
    const reviewsByDate: Record<string, number> = {}
    reviews.forEach((r: any) => {
      const date = new Date(r.created_at).toISOString().split("T")[0]
      reviewsByDate[date] = (reviewsByDate[date] || 0) + 1
    })

    // Top reviewed products
    const productCounts: Record<string, number> = {}
    reviews.forEach((r: any) => {
      if (r.product_id) {
        productCounts[r.product_id] = (productCounts[r.product_id] || 0) + 1
      }
    })
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([product_id, count]) => ({ product_id, review_count: count }))

    res.json({
      period,
      summary: {
        total_reviews: totalReviews,
        approved_reviews: approvedReviews.length,
        pending_reviews: pendingReviews.length,
        rejected_reviews: rejectedReviews.length,
        average_rating: Math.round(averageRating * 10) / 10,
        verified_purchases: verifiedPurchases,
        verified_purchase_rate: totalReviews > 0 ? Math.round((verifiedPurchases / totalReviews) * 100) : 0,
        total_helpful_votes: totalHelpfulVotes
      },
      rating_distribution: ratingDistribution,
      trend: reviewsByDate,
      top_reviewed_products: topProducts
    })

  } catch (error: unknown) {
    handleApiError(res, error, "GET admin reviews analytics")}
}

