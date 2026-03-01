import { useTenant } from "@/lib/context/tenant-context"
import { t, formatDate } from "@/lib/i18n"

interface POIReviewItem {
  id: string
  author: string
  avatar?: string
  rating: number
  content: string
  createdAt: string
  helpful?: number
}

interface POIReviewsProps {
  reviews: POIReviewItem[]
  averageRating?: number
  totalCount?: number
  locale?: string
}

function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= Math.round(rating) ? "text-ds-warning" : "text-ds-muted"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export function POIReviews({
  reviews,
  averageRating,
  totalCount,
  locale: localeProp,
}: POIReviewsProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"

  return (
    <div className="bg-ds-background rounded-lg border border-ds-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-ds-foreground">
          {t(locale, "poi.reviews")}
        </h2>
        {averageRating !== undefined && totalCount !== undefined && (
          <div className="flex items-center gap-2">
            <StarRatingDisplay rating={averageRating} />
            <span className="text-sm font-medium text-ds-foreground">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-ds-muted-foreground">
              ({totalCount})
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-ds-muted-foreground">
          {t(locale, "blocks.no_reviews")}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="pb-4 border-b border-ds-border last:border-0 last:pb-0"
            >
              <div className="flex items-start gap-3">
                {review.avatar ? (
                  <img
                    loading="lazy"
                    src={review.avatar}
                    alt={review.author}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-ds-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-ds-muted-foreground">
                      {review.author.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ds-foreground">
                      {review.author}
                    </span>
                    <span className="text-xs text-ds-muted-foreground">
                      {formatDate(review.createdAt, locale as import("@/lib/i18n").SupportedLocale)}
                    </span>
                  </div>
                  <StarRatingDisplay rating={review.rating} />
                  <p className="text-sm text-ds-muted-foreground mt-2">
                    {review.content}
                  </p>
                  {review.helpful !== undefined && review.helpful > 0 && (
                    <p className="text-xs text-ds-muted-foreground mt-2">
                      {review.helpful} {t(locale, "blocks.found_helpful")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
