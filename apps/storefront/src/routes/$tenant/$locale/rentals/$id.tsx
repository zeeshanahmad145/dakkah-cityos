// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { t, formatCurrency } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/i18n"
import { RentalCalendar } from "@/components/rentals/rental-calendar"
import { RentalPricingTable } from "@/components/rentals/rental-pricing-table"
import { useState, useMemo } from "react"
import { useToast } from "@/components/ui/toast"
import { ReviewListBlock } from "@/components/blocks/review-list-block"
import { MapBlock } from "@/components/blocks/map-block"

function normalizePriceField(val: any, currency: string) {
  if (val == null) return null
  if (typeof val === 'object' && val.amount != null) return val
  return { amount: Number(val), currencyCode: currency }
}

function normalizeRating(val: any, reviewCount: any) {
  if (val == null) return null
  if (typeof val === 'object' && val.average != null) return val
  return { average: Number(val), count: Number(reviewCount || 0) }
}

function normalizeDetail(item: any) {
  if (!item) return null
  const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {})
  const currency = item.currency || item.currency_code || meta.currency || meta.currency_code || "USD"
  const rawRating = item.rating ?? item.avg_rating ?? meta.rating ?? null
  const rawReviewCount = item.review_count ?? meta.review_count ?? null
  return { ...meta, ...item,
    thumbnail: item.thumbnail || item.image_url || item.photo_url || item.banner_url || item.logo_url || meta.thumbnail || (meta.images && meta.images[0]) || null,
    images: meta.images || [item.photo_url || item.banner_url || item.logo_url].filter(Boolean),
    description: item.description || meta.description || "",
    price: item.price ?? meta.price ?? null,
    currency,
    pricePerDay: normalizePriceField(item.pricePerDay ?? item.price_per_day ?? item.price ?? meta.price_per_day, currency),
    pricePerWeek: normalizePriceField(item.pricePerWeek ?? item.price_per_week ?? meta.price_per_week, currency),
    pricePerMonth: normalizePriceField(item.pricePerMonth ?? item.price_per_month ?? meta.price_per_month, currency),
    deposit: normalizePriceField(item.deposit ?? meta.deposit, currency),
    insurance: normalizePriceField(item.insurance ?? meta.insurance, currency),
    rating: normalizeRating(rawRating, rawReviewCount),
    review_count: rawReviewCount,
    location: item.location || item.city || item.address || meta.location || null,
    bookedDates: item.bookedDates || item.booked_dates || meta.booked_dates || [],
  }
}

export const Route = createFileRoute("/$tenant/$locale/rentals/$id")({
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/rentals/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
  component: RentalDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Rental Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
})

const conditionStyles: Record<string, string> = {
  new: "bg-ds-success/20 text-ds-success",
  "like-new": "bg-ds-primary/20 text-ds-primary",
  good: "bg-ds-warning/20 text-ds-warning",
  fair: "bg-ds-muted text-ds-muted-foreground",
}

const conditionKeys: Record<string, string> = {
  new: "rental.new",
  "like-new": "rental.like_new",
  good: "rental.good",
  fair: "rental.fair",
}

function RentalDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const loc = locale as SupportedLocale

  const loaderData = Route.useLoaderData()
  const rental = loaderData?.item
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [rentLoading, setRentLoading] = useState(false)
  const toast = useToast()
  const baseUrl = getServerBaseUrl()
  const publishableKey = getMedusaPublishableKey()

  const handleRentNow = async () => {
    if (!selectedRange) {
      toast.error("Please select rental dates first.")
      return
    }
    setRentLoading(true)
    try {
      const resp = await fetch(`${baseUrl}/store/rentals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": publishableKey },
        credentials: "include",
        body: JSON.stringify({ rental_id: id, start_date: selectedRange.start, end_date: selectedRange.end })
      })
      if (resp.ok) toast.success("Rental reservation submitted successfully!")
      else toast.error("Something went wrong. Please try again.")
    } catch { toast.error("Network error. Please try again.") }
    finally { setRentLoading(false) }
  }

  const selectedDays = useMemo(() => {
    if (!selectedRange) return 0
    const diff = new Date(selectedRange.end).getTime() - new Date(selectedRange.start).getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
  }, [selectedRange])

  if (!rental) {
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
              {t(locale, "common.not_found")}
            </h2>
            <p className="text-ds-muted-foreground mb-6">
              {t(locale, "rental.no_rentals")}
            </p>
            <Link
              to={`${prefix}/rentals` as any}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90 transition-colors"
            >
              {t(locale, "rental.browse_rentals")}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const images = rental.images?.length ? rental.images : rental.thumbnail ? [rental.thumbnail] : []

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-ds-muted-foreground mb-6">
          <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">
            {t(locale, "common.home")}
          </Link>
          <span>/</span>
          <Link to={`${prefix}/rentals` as any} className="hover:text-ds-foreground transition-colors">
            {t(locale, "rental.title")}
          </Link>
          <span>/</span>
          <span className="text-ds-foreground truncate">{rental.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {images.length > 0 && (
              <div className="space-y-3">
                <div className="aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
                  <img
                    src={images[activeImage]}
                    alt={rental.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          i === activeImage ? "border-ds-primary" : "border-ds-border"
                        }`}
                      >
                        <img loading="lazy" src={img} alt={`Rental image ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">
                  {rental.title}
                </h1>
                {rental.condition && (
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      conditionStyles[rental.condition] || conditionStyles.good
                    }`}
                  >
                    {t(locale, conditionKeys[rental.condition] || "rental.good")}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-2xl font-bold text-ds-foreground">
                  {formatCurrency(rental.pricePerDay.amount, rental.pricePerDay.currencyCode, loc)}
                </span>
                <span className="text-ds-muted-foreground">{t(locale, "rental.per_day")}</span>
              </div>

              {rental.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(rental.rating!.average) ? "text-ds-warning" : "text-ds-muted"
                        }`}
                        fill={star <= Math.round(rental.rating!.average) ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-ds-muted-foreground">
                    {rental.rating.average.toFixed(1)} ({rental.rating.count} {t(locale, "blocks.reviews")})
                  </span>
                </div>
              )}

              {rental.location && (
                <div className="flex items-center gap-2 text-ds-muted-foreground">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span>{rental.location}</span>
                </div>
              )}

              {rental.description && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4">
                  <h2 className="text-lg font-semibold text-ds-foreground mb-2">
                    {t(locale, "product.description")}
                  </h2>
                  <p className="text-sm text-ds-muted-foreground leading-relaxed whitespace-pre-line">
                    {rental.description}
                  </p>
                </div>
              )}

              {rental.terms && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4">
                  <h2 className="text-lg font-semibold text-ds-foreground mb-2">
                    {t(locale, "rental.rental_agreement")}
                  </h2>
                  <p className="text-sm text-ds-muted-foreground leading-relaxed whitespace-pre-line">
                    {rental.terms}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <RentalPricingTable
              locale={locale}
              daily={rental.pricePerDay}
              weekly={rental.pricePerWeek}
              monthly={rental.pricePerMonth}
              deposit={rental.deposit}
              insurance={rental.insurance}
              selectedDays={selectedDays}
            />

            <div>
              <h3 className="text-sm font-semibold text-ds-foreground mb-3">
                {t(locale, "rental.select_dates")}
              </h3>
              <RentalCalendar
                locale={locale}
                bookedDates={rental.bookedDates}
                selectedRange={selectedRange}
                onRangeSelect={setSelectedRange}
              />
            </div>

            {selectedRange && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ds-muted-foreground">{t(locale, "rental.rental_period")}</span>
                  <span className="text-ds-foreground font-medium">
                    {selectedRange.start} — {selectedRange.end}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ds-muted-foreground">{selectedDays} days</span>
                </div>
              </div>
            )}

            <button
              onClick={handleRentNow}
              disabled={rentLoading}
              className="w-full px-6 py-3 text-sm font-semibold rounded-lg bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {rentLoading ? "Processing..." : t(locale, "rental.rent_now")}
            </button>

            {rental.vendor && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-4">
                <p className="text-xs text-ds-muted-foreground mb-1">{t(locale, "vendor.title")}</p>
                <p className="text-sm font-medium text-ds-foreground">{rental.vendor.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReviewListBlock productId={rental.id} />
        <MapBlock />
      </div>
    </div>
  )
}
