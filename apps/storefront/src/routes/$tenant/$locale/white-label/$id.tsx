// @ts-nocheck
import {
  getServerBaseUrl,
  fetchWithTimeout,
  getMedusaPublishableKey,
} from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { useToast } from "@/components/ui/toast"
import { ReviewListBlock } from "@/components/blocks/review-list-block"

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

export const Route = createFileRoute("/$tenant/$locale/white-label/$id")({
  component: WhiteLabelDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.title || loaderData?.name || "White Label Details"} | Dakkah CityOS`,
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
        `${baseUrl}/store/white-label/${params.id}`,
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

function WhiteLabelDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleRequestQuote = async () => {
    setLoading(true)
    try {
      toast.success("Quote request sent!")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "White Label Product",
          url: window.location.href,
        })
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard!")
    }
  }

  const loaderData = Route.useLoaderData()
  const product = loaderData?.item

  if (!product) {
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
              Product Not Found
            </h2>
            <p className="text-ds-muted-foreground mb-6">
              This white-label product may have been discontinued or is no
              longer available.
            </p>
            <Link
              to={`${prefix}/white-label` as never}
              className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

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
              to={`${prefix}/white-label` as never}
              className="hover:text-ds-foreground transition-colors"
            >
              White Label
            </Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">
              {product.title || product.name}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[4/3] bg-ds-muted rounded-xl overflow-hidden">
              {product.thumbnail || product.image ? (
                <img
                  loading="lazy"
                  src={product.thumbnail || product.image}
                  alt={product.title || product.name}
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
                      d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M6 6h.008v.008H6V6z"
                    />
                  </svg>
                </div>
              )}
              {product.category && (
                <span className="absolute top-4 start-4 px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary text-ds-primary-foreground">
                  {product.category}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">
                {product.title || product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <span className="text-2xl font-bold text-ds-primary">
                  {product.price != null
                    ? `$${Number(product.price || 0).toLocaleString()}`
                    : t(locale, "verticals.contact_pricing")}
                </span>
                {product.min_order_qty && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-ds-muted text-ds-muted-foreground">
                    Min. {product.min_order_qty} units
                  </span>
                )}
              </div>
            </div>

            {product.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">
                  Description
                </h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <h2 className="font-semibold text-ds-foreground mb-4">
                Product Details
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {product.manufacturer && (
                  <div>
                    <span className="text-ds-muted-foreground">
                      Manufacturer
                    </span>
                    <p className="font-medium text-ds-foreground">
                      {product.manufacturer}
                    </p>
                  </div>
                )}
                {product.lead_time && (
                  <div>
                    <span className="text-ds-muted-foreground">Lead Time</span>
                    <p className="font-medium text-ds-foreground">
                      {product.lead_time}
                    </p>
                  </div>
                )}
                {product.customization_options && (
                  <div>
                    <span className="text-ds-muted-foreground">
                      Customization
                    </span>
                    <p className="font-medium text-ds-foreground">
                      {Array.isArray(product.customization_options)
                        ? product.customization_options.join(", ")
                        : product.customization_options}
                    </p>
                  </div>
                )}
                {product.certifications && (
                  <div>
                    <span className="text-ds-muted-foreground">
                      Certifications
                    </span>
                    <p className="font-medium text-ds-foreground">
                      {Array.isArray(product.certifications)
                        ? product.certifications.join(", ")
                        : product.certifications}
                    </p>
                  </div>
                )}
                {(product.metadata || product.details) &&
                  Object.entries(product.metadata || product.details || {}).map(
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
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-ds-foreground">
                    {product.price != null
                      ? `$${Number(product.price || 0).toLocaleString()}`
                      : t(locale, "verticals.contact_pricing")}
                  </p>
                  {product.min_order_qty && (
                    <p className="text-xs text-ds-muted-foreground mt-1">
                      Minimum order: {product.min_order_qty} units
                    </p>
                  )}
                </div>

                <button
                  onClick={handleRequestQuote}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {loading ? "Sending..." : "Request Quote"}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSaved(!saved)}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm border transition-colors flex items-center justify-center gap-2 ${saved ? "bg-ds-primary/10 border-ds-primary text-ds-primary" : "border-ds-border text-ds-foreground hover:bg-ds-muted"}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill={saved ? "currentColor" : "none"}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    {saved
                      ? t(locale, "common.actions.saved", "Saved")
                      : t(locale, "common.actions.save", "Save")}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 py-2.5 px-4 rounded-lg font-medium text-sm border border-ds-border text-ds-foreground hover:bg-ds-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                    Share
                  </button>
                </div>
              </div>

              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h3 className="font-semibold text-ds-foreground mb-3">
                  White Label Benefits
                </h3>
                <ul className="space-y-2 text-sm text-ds-muted-foreground">
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 mt-0.5 text-ds-primary flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Your brand, your packaging
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 mt-0.5 text-ds-primary flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Full customization available
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 mt-0.5 text-ds-primary flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Quality guaranteed
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReviewListBlock productId={product.id} />
      </div>
    </div>
  )
}
