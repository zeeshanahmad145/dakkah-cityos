import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"

const BACKEND_URL = getServerBaseUrl()

interface Review {
  id: string
  rating: number
  title?: string
  content: string
  customer_name?: string
  is_verified_purchase: boolean
  helpful_count: number
  images: string[]
  created_at: string
}

interface ReviewSummary {
  average_rating: number
  total_reviews: number
  rating_distribution: Record<number, number>
}

interface ProductReviewsResponse {
  reviews: Review[]
  summary: ReviewSummary
  count: number
}

interface VendorReviewsResponse {
  reviews: Review[]
  count: number
}

export function useProductReviews(
  productId: string,
  options?: { limit?: number; offset?: number },
) {
  return useQuery<ProductReviewsResponse>({
    queryKey: ["product-reviews", productId, options],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options?.limit) params.set("limit", options.limit.toString())
      if (options?.offset) params.set("offset", options.offset.toString())

      const response = await fetchWithTimeout(
        `${BACKEND_URL}/store/reviews/products/${productId}?${params}`,
        { credentials: "include" },
      )
      if (!response.ok) throw new Error("Failed to fetch reviews")
      return response.json()
    },
    enabled: !!productId,
  })
}

export function useVendorReviews(
  vendorId: string,
  options?: { limit?: number; offset?: number },
) {
  return useQuery<VendorReviewsResponse>({
    queryKey: ["vendor-reviews", vendorId, options],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options?.limit) params.set("limit", options.limit.toString())
      if (options?.offset) params.set("offset", options.offset.toString())

      const response = await fetchWithTimeout(
        `${BACKEND_URL}/store/reviews/vendors/${vendorId}?${params}`,
        { credentials: "include" },
      )
      if (!response.ok) throw new Error("Failed to fetch reviews")
      return response.json()
    },
    enabled: !!vendorId,
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      rating: number
      title?: string
      content: string
      product_id?: string
      vendor_id?: string
      order_id?: string
    }) => {
      const response = await fetchWithTimeout(`${BACKEND_URL}/store/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error((error instanceof Error ? error.message : String(error)) || "Failed to create review")
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      if (variables.product_id) {
        queryClient.invalidateQueries({
          queryKey: ["product-reviews", variables.product_id],
        })
      }
      if (variables.vendor_id) {
        queryClient.invalidateQueries({
          queryKey: ["vendor-reviews", variables.vendor_id],
        })
      }
    },
  })
}

export function useMarkReviewHelpful() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await fetchWithTimeout(
        `${BACKEND_URL}/store/reviews/${reviewId}/helpful`,
        {
          method: "POST",
          credentials: "include",
        },
      )
      if (!response.ok) throw new Error("Failed to mark review as helpful")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] })
      queryClient.invalidateQueries({ queryKey: ["vendor-reviews"] })
    },
  })
}
