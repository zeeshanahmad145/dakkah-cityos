import { StarRating } from "./star-rating"
import { Check, ThumbUp } from "@medusajs/icons"
import { useMarkReviewHelpful } from "@/lib/hooks/use-reviews"

interface ReviewCardProps {
  review: {
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
}

export function ReviewCard({ review }: ReviewCardProps) {
  const markHelpful = useMarkReviewHelpful()

  const formattedDate = new Date(review.created_at!).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="border-b border-ui-border-base pb-6 last:border-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StarRating rating={review.rating} size="sm" />
            {review.title && (
              <span className="font-medium text-ui-fg-base">{review.title}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-ui-fg-muted">
            <span>{review.customer_name || "Anonymous"}</span>
            {review.is_verified_purchase && (
              <span className="flex items-center gap-1 text-ds-success">
                <Check className="w-3 h-3" />
                Verified Purchase
              </span>
            )}
          </div>
        </div>
        <span className="text-sm text-ui-fg-muted">{formattedDate}</span>
      </div>

      {/* Content */}
      <p className="text-ui-fg-base mb-4">{review.content}</p>

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-4">
          {review.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Review image ${index + 1}`}
              className="w-20 h-20 object-cover rounded"
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => markHelpful.mutate(review.id)}
          disabled={markHelpful.isPending}
          className="flex items-center gap-1 text-sm text-ui-fg-muted hover:text-ui-fg-base transition-colors"
        >
          <ThumbUp className="w-4 h-4" />
          Helpful ({review.helpful_count})
        </button>
      </div>
    </div>
  )
}
