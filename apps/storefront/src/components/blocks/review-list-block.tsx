import React from 'react'
import { Rating } from '../ui/rating'
import { t } from '@/lib/i18n'
import { getMedusaPublishableKey } from '@/lib/utils/env'

interface ReviewItem {
  id: string
  author: string
  avatar?: {
    url: string
    alt?: string
  }
  rating: number
  date: string
  content: string
  verified?: boolean
  helpful?: number
}

interface ReviewListBlockProps {
  heading?: string
  reviews?: ReviewItem[]
  productId?: string
  entityType?: 'product' | 'vendor' | 'service' | 'booking'
  entityId?: string
  limit?: number
  showSummary?: boolean
  showForm?: boolean
  sortBy?: 'recent' | 'rating' | 'helpful'
  locale?: string
}

const localeMap: Record<string, string> = { en: 'en-US', fr: 'fr-FR', ar: 'ar-SA' }

function formatDate(dateStr: string, locale: string = 'en'): string {
  try {
    return new Date(dateStr).toLocaleDateString(localeMap[locale] || 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function computeDistribution(reviews: ReviewItem[]): number[] {
  const counts = [0, 0, 0, 0, 0]
  for (const r of reviews) {
    const idx = Math.min(Math.max(Math.round(r.rating) - 1, 0), 4)
    counts[idx]++
  }
  return counts
}

export const ReviewListBlock: React.FC<ReviewListBlockProps> = ({
  heading,
  reviews = [],
  productId,
  limit,
  showSummary = true,
  sortBy = 'recent',
  locale = 'en',
}) => {
  const [fetchedReviews, setFetchedReviews] = React.useState<ReviewItem[]>([])

  React.useEffect(() => {
    if (!productId) return
    if (typeof window === 'undefined') return
    const controller = new AbortController()
    const publishableKey = getMedusaPublishableKey()
    const headers: Record<string, string> = {}
    if (publishableKey) headers['x-publishable-api-key'] = publishableKey

    fetch(`/store/reviews/products/${productId}`, {
      headers,
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) return null
        return res.json()
      })
      .then((data) => {
        if (!data) return
        const items = Array.isArray(data.reviews) ? data.reviews : Array.isArray(data.data) ? data.data : []
        if (!items.length) return
        const mapped: ReviewItem[] = items.map((r: any) => ({
          id: r.id,
          author: r.customer_name || 'Anonymous',
          rating: r.rating,
          date: r.created_at,
          content: r.content,
          verified: r.is_verified_purchase,
          helpful: r.helpful_count,
        }))
        setFetchedReviews(mapped)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [productId])

  const allReviews = React.useMemo(() => {
    const ids = new Set(reviews.map((r) => r.id))
    return [...reviews, ...fetchedReviews.filter((r) => !ids.has(r.id))]
  }, [reviews, fetchedReviews])

  const sorted = React.useMemo(() => {
    const copy = [...allReviews]
    if (sortBy === 'rating') copy.sort((a, b) => b.rating - a.rating)
    else if (sortBy === 'helpful') copy.sort((a, b) => (b.helpful ?? 0) - (a.helpful ?? 0))
    else copy.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return limit ? copy.slice(0, limit) : copy
  }, [allReviews, sortBy, limit])

  const avgRating =
    allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length : 0
  const distribution = React.useMemo(() => computeDistribution(allReviews), [allReviews])
  const maxCount = Math.max(...distribution, 1)

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6">
        {heading && (
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-ds-foreground text-center mb-8 md:mb-12">
            {heading}
          </h2>
        )}

        {showSummary && allReviews.length > 0 && (
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8 md:mb-12 p-6 rounded-lg border border-ds-border bg-ds-card">
            <div className="text-center shrink-0">
              <p className="text-5xl font-bold text-ds-foreground">{avgRating.toFixed(1)}</p>
              <div className="mt-2">
                <Rating value={avgRating} size="md" />
              </div>
              <p className="text-sm text-ds-muted-foreground mt-2">
                {allReviews.length} {t(locale, 'blocks.reviews')}
              </p>
            </div>
            <div className="flex-1 w-full space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star - 1]
                const pct = (count / maxCount) * 100
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm text-ds-muted-foreground w-8 text-end">{star}★</span>
                    <div className="flex-1 h-2 rounded-full bg-ds-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-ds-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm text-ds-muted-foreground w-8">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {sorted.length === 0 && (
          <div className="text-center py-12">
            <p className="text-ds-muted-foreground">{t(locale, 'blocks.no_reviews')}</p>
          </div>
        )}

        <div className="space-y-6">
          {sorted.map((review) => (
            <div
              key={review.id}
              className="p-6 rounded-lg border border-ds-border bg-ds-card"
            >
              <div className="flex items-start gap-4">
                {review.avatar?.url ? (
                  <img
                    src={review.avatar.url}
                    alt={review.avatar.alt || review.author}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-ds-muted flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-ds-muted-foreground">
                      {review.author.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="font-semibold text-ds-foreground">{review.author}</span>
                    {review.verified && (
                      <span className="inline-flex items-center gap-1 text-xs text-ds-primary">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {t(locale, 'blocks.verified')}
                      </span>
                    )}
                    <span className="text-xs text-ds-muted-foreground">
                      {formatDate(review.date, locale)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <Rating value={review.rating} size="sm" />
                  </div>
                  <p className="mt-3 text-sm md:text-base text-ds-foreground leading-relaxed">
                    {review.content}
                  </p>
                  {review.helpful !== undefined && review.helpful > 0 && (
                    <p className="mt-3 text-xs text-ds-muted-foreground">
                      {review.helpful} {t(locale, 'blocks.found_helpful')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
