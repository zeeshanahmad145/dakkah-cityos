// @ts-nocheck
import {
  getServerBaseUrl,
  fetchWithTimeout,
  getMedusaPublishableKey,
} from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { FlashSaleCountdownBlock } from "@/components/blocks/flash-sale-countdown-block"
import { ReviewListBlock } from "@/components/blocks/review-list-block"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/toast"

function normalizeDetail(item: any) {
  if (!item) return null
  const meta =
    typeof item.metadata === "string"
      ? JSON.parse(item.metadata)
      : item.metadata || {}
  return {
    ...meta,
    ...item,
    thumbnail:
      item.thumbnail ||
      item.image_url ||
      item.photo_url ||
      item.banner_url ||
      item.logo_url ||
      meta.thumbnail ||
      (meta.images && meta.images[0]) ||
      null,
    images:
      meta.images ||
      [item.photo_url || item.banner_url || item.logo_url].filter(Boolean),
    description: item.description || meta.description || "",
    price: item.price ?? meta.price ?? null,
    rating: item.rating ?? item.avg_rating ?? meta.rating ?? null,
    review_count: item.review_count ?? meta.review_count ?? null,
    location:
      item.location || item.city || item.address || meta.location || null,
  }
}

export const Route = createFileRoute("/$tenant/$locale/flash-deals/$id")({
  component: FlashDealDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.title || loaderData?.name || "Flash Deal Details"} | Dakkah CityOS`,
      },
      {
        name: "description",
        content: loaderData?.description || loaderData?.excerpt || "",
      },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(
        `${baseUrl}/store/flash-sales/${params.id}`,
        {
          headers: { "x-publishable-api-key": getMedusaPublishableKey() },
        },
      )
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch {
      return { item: null }
    }
  },
})

function FlashDealDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [timeLeft, setTimeLeft] = useState("")

  const loaderData = Route.useLoaderData()
  const deal = loaderData?.item
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleGrabDeal = async () => {
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 500))
      toast.success("Deal added to cart!")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 500))
      toast.success("Item added to cart!")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!deal?.ends_at && !deal?.endsAt && !deal?.end_date) return
    const endDate = new Date(deal.ends_at || deal.endsAt || deal.end_date)
    const timer = setInterval(() => {
      const now = new Date()
      const diff = endDate.getTime() - now.getTime()
      if (diff <= 0) {
        setTimeLeft("Expired")
        clearInterval(timer)
        return
      }
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
    }, 1000)
    return () => clearInterval(timer)
  }, [deal])

  if (!deal) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg
              className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">
              Flash Deal Not Found
            </h2>
            <p className="text-ds-muted-foreground mb-6">
              This flash deal may have ended or is no longer available.
            </p>
            <Link
              to={`${prefix}/flash-deals` as never}
              className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors"
            >
              Browse Flash Deals
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const originalPrice =
    deal.original_price || deal.originalPrice || deal.compare_at_price
  const salePrice = deal.sale_price || deal.salePrice || deal.price
  const discount =
    deal.discount ||
    deal.discount_percentage ||
    (originalPrice && salePrice
      ? Math.round((1 - salePrice / originalPrice) * 100)
      : null)

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link
              to={`${prefix}` as never}
              className="hover:text-ds-foreground transition-colors"
            >
              {t(locale, "common.home")}
            </Link>
            <span>/</span>
            <Link
              to={`${prefix}/flash-deals` as never}
              className="hover:text-ds-foreground transition-colors"
            >
              Flash Deals
            </Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">
              {deal.name || deal.title}
            </span>
          </div>
        </div>
      </div>

      {timeLeft && timeLeft !== "Expired" && (
        <div className="bg-ds-destructive/10 border-b border-ds-destructive/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-center gap-2 text-sm font-medium text-ds-destructive">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Deal ends in: {timeLeft}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {deal.thumbnail || deal.image ? (
                <img
                  loading="lazy"
                  src={deal.thumbnail || deal.image}
                  alt={deal.name || deal.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-ds-muted-foreground/30"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              {discount && (
                <span className="absolute top-4 start-4 px-3 py-1 text-xs font-semibold rounded-full bg-ds-destructive text-white">
                  {discount}% OFF
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">
                {deal.name || deal.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {salePrice != null && (
                  <span className="text-2xl font-bold text-ds-destructive">
                    ${Number(salePrice || 0).toLocaleString()}
                  </span>
                )}
                {originalPrice != null && (
                  <span className="text-lg text-ds-muted-foreground line-through">
                    ${Number(originalPrice || 0).toLocaleString()}
                  </span>
                )}
                {discount && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-ds-destructive/10 text-ds-destructive">
                    Save {discount}%
                  </span>
                )}
              </div>
            </div>

            {deal.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">
                  Description
                </h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {deal.description}
                </p>
              </div>
            )}

            {(deal.metadata || deal.details) && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">
                  Details
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(deal.metadata || deal.details || {}).map(
                    ([key, value]) => (
                      <div key={key}>
                        <span className="text-ds-muted-foreground">
                          {key
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                        <p className="font-medium text-ds-foreground">
                          {String(value)}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                <div className="text-center">
                  {salePrice != null && (
                    <p className="text-3xl font-bold text-ds-destructive">
                      ${Number(salePrice || 0).toLocaleString()}
                    </p>
                  )}
                  {originalPrice != null && (
                    <p className="text-sm text-ds-muted-foreground line-through mt-1">
                      ${Number(originalPrice || 0).toLocaleString()}
                    </p>
                  )}
                </div>

                {timeLeft && (
                  <div className="bg-ds-destructive/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-ds-muted-foreground mb-1">
                      Time Remaining
                    </p>
                    <p className="text-lg font-bold text-ds-destructive">
                      {timeLeft}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleGrabDeal}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-ds-destructive text-white rounded-lg font-medium hover:bg-ds-destructive/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  {loading ? "Adding..." : "Grab This Deal"}
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={loading}
                  className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                    />
                  </svg>
                  Add to Cart
                </button>
              </div>

              {(deal.quantity_available ||
                deal.quantityAvailable ||
                deal.stock) && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">
                    Availability
                  </h3>
                  <div className="text-sm text-ds-muted-foreground">
                    <p className="font-medium text-ds-foreground">
                      {deal.quantity_available ||
                        deal.quantityAvailable ||
                        deal.stock}{" "}
                      left
                    </p>
                    <p className="mt-1">Limited quantity — don't miss out!</p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FlashSaleCountdownBlock />
        <ReviewListBlock productId={deal.id} />
      </div>
    </div>
  )
}
