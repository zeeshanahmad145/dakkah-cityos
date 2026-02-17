import { MedusaService } from "@medusajs/framework/utils"
import { Review } from "./models/review"

class ReviewModuleService extends MedusaService({
  Review,
}) {
  // ============ Explicitly declare auto-generated methods for TS compiler ============
  declare listReviews: any;
  declare retrieveReview: any;
  declare createReviews: any;
  declare updateReviews: any;
  declare deleteReviews: any;

  async createReview(data: {
    rating: number
    title?: string
    content: string
    customer_id: string
    customer_name?: string
    customer_email?: string
    product_id?: string
    vendor_id?: string
    order_id?: string
    is_verified_purchase?: boolean
    images?: string[]
    metadata?: Record<string, unknown>
  }) {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new Error("Rating must be between 1 and 5")
    }

    // Must have either product_id or vendor_id
    if (!data.product_id && !data.vendor_id) {
      throw new Error("Review must be for a product or vendor")
    }

    const review = await this.createReviews({
      ...data,
      is_approved: false, // Reviews require approval by default
      helpful_count: 0,
    })

    return review
  }

  async listProductReviews(
    productId: string,
    options?: {
      limit?: number
      offset?: number
      approved_only?: boolean
    }
  ) {
    const filters: Record<string, any> = {
      product_id: productId,
    }

    if (options?.approved_only !== false) {
      filters.is_approved = true
    }

    const reviews = await this.listReviews(filters, {
      take: options?.limit || 10,
      skip: options?.offset || 0,
      order: { created_at: "DESC" },
    })

    return reviews
  }

  async listVendorReviews(
    vendorId: string,
    options?: {
      limit?: number
      offset?: number
      approved_only?: boolean
    }
  ) {
    const filters: Record<string, any> = {
      vendor_id: vendorId,
    }

    if (options?.approved_only !== false) {
      filters.is_approved = true
    }

    const reviews = await this.listReviews(filters, {
      take: options?.limit || 10,
      skip: options?.offset || 0,
      order: { created_at: "DESC" },
    })

    return reviews
  }

  async getProductRatingSummary(productId: string) {
    const reviews = await this.listReviews(
      { product_id: productId, is_approved: true },
      { select: ["rating"] }
    )

    if (reviews.length === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      }
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let totalRating = 0

    for (const review of reviews) {
      totalRating += review.rating
      distribution[review.rating as keyof typeof distribution]++
    }

    return {
      average_rating: Math.round((totalRating / reviews.length) * 10) / 10,
      total_reviews: reviews.length,
      rating_distribution: distribution,
    }
  }

  async approveReview(reviewId: string) {
    return this.updateReviews({ id: reviewId, is_approved: true })
  }

  async rejectReview(reviewId: string) {
    return this.deleteReviews(reviewId)
  }

  async markHelpful(reviewId: string) {
    const review = await this.retrieveReview(reviewId)
    return this.updateReviews(
      { id: reviewId, helpful_count: (review.helpful_count || 0) + 1 }
    )
  }

  async getReviewAnalytics(vendorId: string) {
    const reviews = await this.listReviews(
      { vendor_id: vendorId, is_approved: true }
    ) as any
    const reviewList = Array.isArray(reviews) ? reviews : [reviews].filter(Boolean)

    if (reviewList.length === 0) {
      return {
        vendorId,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        responseRate: 0,
        verifiedPurchaseRate: 0,
      }
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let totalRating = 0
    let verifiedCount = 0
    let respondedCount = 0

    for (const review of reviewList) {
      totalRating += review.rating
      distribution[review.rating as keyof typeof distribution]++
      if (review.is_verified_purchase) verifiedCount++
      if (review.vendor_response || review.response) respondedCount++
    }

    return {
      vendorId,
      averageRating: Math.round((totalRating / reviewList.length) * 10) / 10,
      totalReviews: reviewList.length,
      ratingDistribution: distribution,
      responseRate: Math.round((respondedCount / reviewList.length) * 100),
      verifiedPurchaseRate: Math.round((verifiedCount / reviewList.length) * 100),
    }
  }

  async flagInappropriateReview(reviewId: string, reason: string, reporterId: string) {
    if (!reviewId || !reason || !reporterId) {
      throw new Error("Review ID, reason, and reporter ID are required")
    }

    const review = await this.retrieveReview(reviewId) as any

    const existingFlags = Array.isArray(review.flags) ? review.flags : []
    const alreadyFlagged = existingFlags.some(
      (f: any) => f.reporterId === reporterId
    )
    if (alreadyFlagged) {
      throw new Error("You have already flagged this review")
    }

    const newFlag = {
      reporterId,
      reason,
      flaggedAt: new Date().toISOString(),
    }

    const updatedFlags = [...existingFlags, newFlag]
    const flagCount = updatedFlags.length
    const needsModeration = flagCount >= 3

    await this.updateReviews(
      { 
        id: reviewId,
        metadata: {
          ...(review.metadata || {}),
          flags: updatedFlags,
          flag_count: flagCount,
          needs_moderation: needsModeration,
          last_flagged_at: new Date().toISOString(),
        },
      }
    )

    return {
      reviewId,
      flagCount,
      needsModeration,
      status: needsModeration ? "pending_moderation" : "flagged",
    }
  }

  async getReviewTrends(vendorId: string, months?: number) {
    const monthCount = months || 6
    const now = new Date()
    const reviews = await this.listReviews(
      { vendor_id: vendorId, is_approved: true }
    ) as any
    const reviewList = Array.isArray(reviews) ? reviews : [reviews].filter(Boolean)

    const trends: Array<{
      month: string
      year: number
      totalReviews: number
      averageRating: number
      positiveCount: number
      negativeCount: number
    }> = []

    for (let i = monthCount - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59)

      const monthReviews = reviewList.filter((r: any) => {
        const createdAt = new Date(r.created_at)
        return createdAt >= monthStart && createdAt <= monthEnd
      })

      let totalRating = 0
      let positiveCount = 0
      let negativeCount = 0

      for (const review of monthReviews) {
        totalRating += review.rating
        if (review.rating >= 4) positiveCount++
        if (review.rating <= 2) negativeCount++
      }

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

      trends.push({
        month: monthNames[targetDate.getMonth()],
        year: targetDate.getFullYear(),
        totalReviews: monthReviews.length,
        averageRating: monthReviews.length > 0
          ? Math.round((totalRating / monthReviews.length) * 10) / 10
          : 0,
        positiveCount,
        negativeCount,
      })
    }

    return {
      vendorId,
      periodMonths: monthCount,
      trends,
    }
  }
}

export default ReviewModuleService
