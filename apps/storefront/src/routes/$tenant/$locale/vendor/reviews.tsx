// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState } from "react"

interface Review {
  id: string
  product_id: string
  product_name?: string
  customer_id: string
  customer_name?: string
  rating: number
  title?: string
  content: string
  status: string
  vendor_reply?: string
  vendor_reply_at?: string
  is_verified: boolean
  helpful_count: number
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/reviews")({
  component: VendorReviewsRoute,
})

function VendorReviewsRoute() {
  const auth = useAuth()
  const [ratingFilter, setRatingFilter] = useState<string>("")
  const [replyText, setReplyText] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vendor-reviews", ratingFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (ratingFilter) params.set("rating", ratingFilter)
      const url = `/vendor/reviews${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: Review[]; count: number }>(url, { credentials: "include" })
    },
  })

  const items = data?.items || []

  const avgRating = items.length > 0 ? (items.reduce((sum, r) => sum + r.rating, 0) / items.length).toFixed(1) : "0.0"

  const ratingDistribution = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: items.filter((rev) => rev.rating === r).length,
    pct: items.length > 0 ? Math.round((items.filter((rev) => rev.rating === r).length / items.length) * 100) : 0,
  }))

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return
    try {
      await sdk.client.fetch("/vendor/reviews", {
        method: "POST",
        body: { review_id: reviewId, reply: replyText },
        credentials: "include",
      })
      setReplyingTo(null)
      setReplyText("")
      refetch()
    } catch (e) { console.error("Failed to submit review reply:", e) }
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? "text-ds-warning" : "text-ds-muted-foreground/50"}>&#9733;</span>
    ))
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-muted-foreground mt-1">Monitor and respond to customer reviews</p>
        </div>
        <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-ds-card border rounded-lg p-6">
          <div className="text-center mb-4">
            <p className="text-5xl font-bold">{avgRating}</p>
            <div className="flex items-center justify-center text-xl mt-1">{renderStars(Math.round(Number(avgRating)))}</div>
            <p className="text-sm text-muted-foreground mt-1">{items.length} total reviews</p>
          </div>
        </div>
        <div className="bg-ds-card border rounded-lg p-6">
          <h3 className="font-semibold mb-3">Rating Distribution</h3>
          {ratingDistribution.map((r) => (
            <div key={r.stars} className="flex items-center gap-2 mb-2">
              <span className="text-sm w-12">{r.stars} star</span>
              <div className="flex-1 bg-ds-muted rounded-full h-2">
                <div className="bg-ds-warning h-2 rounded-full" style={{ width: `${r.pct}%` }} />
              </div>
              <span className="text-xs text-muted-foreground w-8">{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-ds-card rounded-lg border">
          <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
          <p className="text-muted-foreground">Customer reviews for your products will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((review) => (
            <div key={review.id} className="bg-ds-card border rounded-lg p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{renderStars(review.rating)}</span>
                    {review.is_verified && <span className="text-xs bg-ds-success/15 text-ds-success px-2 py-0.5 rounded">Verified</span>}
                  </div>
                  {review.title && <h4 className="font-medium">{review.title}</h4>}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(review.created_at!).toLocaleDateString()}</span>
              </div>
              <p className="text-sm mb-3">{review.content}</p>
              {review.product_name && <p className="text-xs text-muted-foreground mb-3">Product: {review.product_name}</p>}
              {review.vendor_reply ? (
                <div className="bg-ds-info/10 rounded p-3 mt-2">
                  <p className="text-xs font-medium text-ds-info mb-1">Your Reply:</p>
                  <p className="text-sm text-ds-info">{review.vendor_reply}</p>
                </div>
              ) : replyingTo === review.id ? (
                <div className="mt-3">
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write your reply..." className="w-full border rounded-lg p-3 text-sm min-h-[80px] mb-2" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setReplyingTo(null); setReplyText("") }} className="px-3 py-1.5 border rounded text-sm">Cancel</button>
                    <button onClick={() => handleReply(review.id)} className="px-3 py-1.5 bg-primary text-white rounded text-sm">Reply</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setReplyingTo(review.id)} className="text-sm text-primary hover:underline mt-2">Reply to review</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
