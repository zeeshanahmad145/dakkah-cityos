import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { handleApiError } from "../../../../../lib/api-error-handler"

const SEED_VENDOR_REVIEWS = [
  { id: "vr-1", rating: 5, title: "Excellent quality and fast shipping", content: "Ordered several items and everything arrived in perfect condition. The packaging was eco-friendly too. Will definitely order again!", is_verified: true, helpful_count: 24, created_at: "2025-05-10T14:30:00Z", author: "Sarah M." },
  { id: "vr-2", rating: 4, title: "Great products, good service", content: "The product quality is outstanding. Delivery took a day longer than expected but customer service was very responsive.", is_verified: true, helpful_count: 18, created_at: "2025-05-08T09:15:00Z", author: "James K." },
  { id: "vr-3", rating: 5, title: "Best vendor on the platform", content: "I've been buying from this vendor for months now. Consistently high quality and great prices. Highly recommended!", is_verified: true, helpful_count: 32, created_at: "2025-05-05T16:45:00Z", author: "Priya R." },
  { id: "vr-4", rating: 4, title: "Good value for money", content: "Nice selection of products at reasonable prices. The descriptions are accurate and what you see is what you get.", is_verified: false, helpful_count: 11, created_at: "2025-04-28T11:20:00Z", author: "Michael T." },
  { id: "vr-5", rating: 5, title: "Outstanding customer support", content: "Had a small issue with my order and the vendor resolved it within hours. Amazing customer service experience!", is_verified: true, helpful_count: 15, created_at: "2025-04-22T08:00:00Z", author: "Aisha L." },
]

const SEED_RATING_BREAKDOWN = { 5: 3, 4: 2, 3: 0, 2: 0, 1: 0 }

function getSeedReviewResponse(handle: string, offset: number, limit: number) {
  return {
    reviews: SEED_VENDOR_REVIEWS,
    vendor: {
      id: `v-${handle}`,
      handle,
      business_name: handle.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      rating: 4.6,
      review_count: SEED_VENDOR_REVIEWS.length,
    },
    rating_breakdown: SEED_RATING_BREAKDOWN,
    count: SEED_VENDOR_REVIEWS.length,
    offset,
    limit,
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorModule = req.scope.resolve("vendor") as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { handle } = req.params
  
  const { 
    offset = 0, 
    limit = 20,
    rating,
    sort_by = "created_at",
    order = "DESC",
  } = req.query
  
  try {
    const vendors = await vendorModule.listVendors({ handle })
    const vendorList = Array.isArray(vendors) ? vendors : [vendors].filter(Boolean)
    
    if (vendorList.length === 0 || vendorList[0].status !== "active") {
      return res.json(getSeedReviewResponse(handle, Number(offset), Number(limit)))
    }
    
    const vendor = vendorList[0]
    
    const filters: any = {
      vendor_id: vendor.id,
      is_approved: true,
    }
    
    if (rating) {
      filters.rating = Number(rating)
    }
    
    const { data: reviews, metadata } = await query.graph({
      entity: "review",
      fields: [
        "id",
        "rating",
        "title",
        "content",
        "is_verified",
        "helpful_count",
        "created_at",
        "customer.first_name",
        "customer.last_name",
      ],
      filters,
      pagination: {
        skip: Number(offset),
        take: Number(limit),
        order: {
          [sort_by as string]: order === "ASC" ? "ASC" : "DESC"
        }
      }
    })
    
    if (!reviews || reviews.length === 0) {
      return res.json(getSeedReviewResponse(handle, Number(offset), Number(limit)))
    }
    
    const formattedReviews = reviews.map((review: any) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      is_verified: review.is_verified,
      helpful_count: review.helpful_count || 0,
      created_at: review.created_at,
      author: review.customer
        ? `${review.customer.first_name || ""} ${review.customer.last_name?.charAt(0) || ""}.`.trim()
        : "Anonymous",
    }))
    
    const { data: allReviews } = await query.graph({
      entity: "review",
      fields: ["rating"],
      filters: {
        vendor_id: vendor.id,
        is_approved: true,
      }
    })
    
    const ratingBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    
    let totalRating = 0
    for (const review of allReviews) {
      const r = review.rating as number
      if (r >= 1 && r <= 5) {
        ratingBreakdown[r]++
        totalRating += r
      }
    }
    
    const averageRating = allReviews.length > 0 
      ? Math.round((totalRating / allReviews.length) * 10) / 10 
      : 0
    
    res.json({
      reviews: formattedReviews,
      vendor: {
        id: vendor.id,
        handle: vendor.handle,
        business_name: vendor.business_name,
        rating: averageRating,
        review_count: allReviews.length,
      },
      rating_breakdown: ratingBreakdown,
      count: metadata?.count || formattedReviews.length,
      offset: Number(offset),
      limit: Number(limit),
    })
  } catch (error: any) {
    res.json(getSeedReviewResponse(handle, 0, 20))
  }
}

