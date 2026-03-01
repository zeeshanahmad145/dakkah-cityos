import { MedusaService } from "@medusajs/framework/utils";
import { Review } from "./models/review";

type ReviewRecord = {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  customer_id: string;
  customer_name: string | null;
  customer_email: string | null;
  product_id: string | null;
  vendor_id: string | null;
  order_id: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  images: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
};

type RatingDistribution = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

interface ReviewServiceBase {
  retrieveReview(id: string): Promise<ReviewRecord>;
  listReviews(
    filters?: Record<string, unknown>,
    opts?: Record<string, unknown>,
  ): Promise<ReviewRecord[]>;
  createReviews(data: Record<string, unknown>): Promise<ReviewRecord>;
  updateReviews(data: Record<string, unknown>): Promise<ReviewRecord>;
  deleteReviews(id: string): Promise<void>;
}

const Base = MedusaService({ Review });

class ReviewModuleService extends Base implements ReviewServiceBase {
  async createReview(data: {
    rating: number;
    title?: string;
    content: string;
    customer_id: string;
    customer_name?: string;
    customer_email?: string;
    product_id?: string;
    vendor_id?: string;
    order_id?: string;
    is_verified_purchase?: boolean;
    images?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<ReviewRecord> {
    if (data.rating < 1 || data.rating > 5)
      throw new Error("Rating must be between 1 and 5");
    if (!data.product_id && !data.vendor_id)
      throw new Error("Review must be for a product or vendor");

    return this.createReviews({
      ...data,
      images: (data.images ?? null) as unknown as Record<
        string,
        unknown
      > | null,
      is_approved: false,
      helpful_count: 0,
    } as any);
  }

  async listProductReviews(
    productId: string,
    options?: { limit?: number; offset?: number; approved_only?: boolean },
  ): Promise<ReviewRecord[]> {
    const filters: Record<string, unknown> = { product_id: productId };
    if (options?.approved_only !== false) filters.is_approved = true;
    return this.listReviews(filters, {
      take: options?.limit ?? 10,
      skip: options?.offset ?? 0,
      order: { created_at: "DESC" },
    });
  }

  async listVendorReviews(
    vendorId: string,
    options?: { limit?: number; offset?: number; approved_only?: boolean },
  ): Promise<ReviewRecord[]> {
    const filters: Record<string, unknown> = { vendor_id: vendorId };
    if (options?.approved_only !== false) filters.is_approved = true;
    return this.listReviews(filters, {
      take: options?.limit ?? 10,
      skip: options?.offset ?? 0,
      order: { created_at: "DESC" },
    });
  }

  async getProductRatingSummary(productId: string): Promise<{
    average_rating: number;
    total_reviews: number;
    rating_distribution: RatingDistribution;
  }> {
    const reviews = await this.listReviews(
      { product_id: productId, is_approved: true },
      { select: ["rating"] },
    ) as any;
    if (reviews.length === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const distribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    for (const review of reviews) {
      totalRating += review.rating;
      distribution[review.rating as keyof RatingDistribution]++;
    }

    return {
      average_rating: Math.round((totalRating / reviews.length) * 10) / 10,
      total_reviews: reviews.length,
      rating_distribution: distribution,
    };
  }

  async approveReview(reviewId: string): Promise<ReviewRecord> {
    return this.updateReviews({ id: reviewId, is_approved: true } as any);
  }

  async rejectReview(reviewId: string): Promise<void> {
    return this.deleteReviews(reviewId);
  }

  async markHelpful(reviewId: string): Promise<ReviewRecord> {
    const review = await this.retrieveReview(reviewId) as any;
    return this.updateReviews({
      id: reviewId,
      helpful_count: (review.helpful_count ?? 0) + 1,
    } as any);
  }

  async getReviewAnalytics(vendorId: string): Promise<{
    vendorId: string;
    averageRating: number;
    totalReviews: number;
    ratingDistribution: RatingDistribution;
    responseRate: number;
    verifiedPurchaseRate: number;
  }> {
    const reviews = await this.listReviews({
      vendor_id: vendorId,
      is_approved: true,
    }) as any;
    if (reviews.length === 0) {
      return {
        vendorId,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        responseRate: 0,
        verifiedPurchaseRate: 0,
      };
    }

    const distribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    let verifiedCount = 0;
    let respondedCount = 0;

    for (const review of reviews) {
      totalRating += review.rating;
      distribution[review.rating as keyof RatingDistribution]++;
      if (review.is_verified_purchase) verifiedCount++;
      const meta = review.metadata as Record<string, unknown> | null;
      if (meta?.vendor_response || meta?.response) respondedCount++;
    }

    return {
      vendorId,
      averageRating: Math.round((totalRating / reviews.length) * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution: distribution,
      responseRate: Math.round((respondedCount / reviews.length) * 100),
      verifiedPurchaseRate: Math.round((verifiedCount / reviews.length) * 100),
    };
  }

  async flagInappropriateReview(
    reviewId: string,
    reason: string,
    reporterId: string,
  ): Promise<{
    reviewId: string;
    flagCount: number;
    needsModeration: boolean;
    status: string;
  }> {
    if (!reviewId || !reason || !reporterId) {
      throw new Error("Review ID, reason, and reporter ID are required");
    }

    const review = await this.retrieveReview(reviewId) as any;
    const meta = review.metadata as Record<string, unknown> | null;
    const existingFlags = Array.isArray(meta?.flags)
      ? (meta.flags as Array<{ reporterId: string }>)
      : [];

    if (existingFlags.some((f) => f.reporterId === reporterId)) {
      throw new Error("You have already flagged this review");
    }

    const newFlag = { reporterId, reason, flaggedAt: new Date().toISOString() };
    const updatedFlags = [...existingFlags, newFlag];
    const flagCount = updatedFlags.length;
    const needsModeration = flagCount >= 3;

    await this.updateReviews({
      id: reviewId,
      metadata: {
        ...(meta ?? {} as any),
        flags: updatedFlags,
        flag_count: flagCount,
        needs_moderation: needsModeration,
        last_flagged_at: new Date().toISOString(),
      },
    });

    return {
      reviewId,
      flagCount,
      needsModeration,
      status: needsModeration ? "pending_moderation" : "flagged",
    };
  }

  async getReviewTrends(
    vendorId: string,
    months = 6,
  ): Promise<{
    vendorId: string;
    periodMonths: number;
    trends: Array<{
      month: string;
      year: number;
      totalReviews: number;
      averageRating: number;
      positiveCount: number;
      negativeCount: number;
    }>;
  }> {
    const now = new Date();
    const reviews = await this.listReviews({
      vendor_id: vendorId,
      is_approved: true,
    }) as any;
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const trends = Array.from({ length: months }, (_, i) => {
      const targetDate = new Date(
        now.getFullYear(),
        now.getMonth() - (months - 1 - i),
        1,
      );
      const monthStart = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        1,
      );
      const monthEnd = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      const monthReviews = reviews.filter((r) => {
        const createdAt = new Date(r.created_at as Date | string);
        return createdAt >= monthStart && createdAt <= monthEnd;
      });

      let totalRating = 0;
      let positiveCount = 0;
      let negativeCount = 0;
      for (const r of monthReviews) {
        totalRating += r.rating;
        if (r.rating >= 4) positiveCount++;
        if (r.rating <= 2) negativeCount++;
      }

      return {
        month: monthNames[targetDate.getMonth()],
        year: targetDate.getFullYear(),
        totalReviews: monthReviews.length,
        averageRating:
          monthReviews.length > 0
            ? Math.round((totalRating / monthReviews.length) * 10) / 10
            : 0,
        positiveCount,
        negativeCount,
      };
    });

    return { vendorId, periodMonths: months, trends };
  }
}

export default ReviewModuleService;
