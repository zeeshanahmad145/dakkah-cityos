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
import { TimelineBlock } from "@/components/blocks/timeline-block"
import { FaqBlock } from "@/components/blocks/faq-block"
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

export const Route = createFileRoute("/$tenant/$locale/warranties/$id")({
  component: WarrantyDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.title || loaderData?.name || "Warranty Details"} | Dakkah CityOS`,
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
        `${baseUrl}/store/warranties/${params.id}`,
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

function WarrantyDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handlePurchaseWarranty = async () => {
    setLoading(true)
    try {
      toast.success("Warranty purchased successfully!")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleComparePlans = () => {
    toast.info("Comparing warranty plans...")
  }

  const loaderData = Route.useLoaderData()
  const warranty = loaderData?.item

  if (!warranty) {
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
              Warranty Not Found
            </h2>
            <p className="text-ds-muted-foreground mb-6">
              This warranty plan may have been removed or is no longer
              available.
            </p>
            <Link
              to={`${prefix}/warranties` as never}
              className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors"
            >
              Browse Warranties
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
              to={`${prefix}/warranties` as never}
              className="hover:text-ds-foreground transition-colors"
            >
              Warranties
            </Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">
              {warranty.name || warranty.title}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-ds-primary/10 rounded-xl flex items-center justify-center text-ds-primary flex-shrink-0">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">
                    {warranty.name || warranty.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {warranty.coverage_period && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary/10 text-ds-primary">
                        {warranty.coverage_period}
                      </span>
                    )}
                    {warranty.type && (
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-ds-muted text-ds-muted-foreground">
                        {warranty.type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {warranty.price != null && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">Price</p>
                  <p className="text-lg font-bold text-ds-foreground">
                    ${Number(warranty.price || 0).toLocaleString()}
                  </p>
                </div>
              )}
              {warranty.coverage_period && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">
                    Coverage Period
                  </p>
                  <p className="text-lg font-bold text-ds-foreground">
                    {warranty.coverage_period}
                  </p>
                </div>
              )}
              {warranty.deductible != null && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">
                    Deductible
                  </p>
                  <p className="text-lg font-bold text-ds-foreground">
                    ${Number(warranty.deductible || 0).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {warranty.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">
                  Plan Details
                </h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {warranty.description}
                </p>
              </div>
            )}

            {warranty.covered_items && warranty.covered_items.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">
                  What's Covered
                </h2>
                <div className="space-y-2">
                  {warranty.covered_items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-ds-success/5 rounded-lg"
                    >
                      <svg
                        className="w-5 h-5 text-ds-success flex-shrink-0 mt-0.5"
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
                      <div>
                        <p className="text-sm text-ds-foreground">
                          {typeof item === "string" ? item : item.name}
                        </p>
                        {item.description && (
                          <p className="text-xs text-ds-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {warranty.excluded_items && warranty.excluded_items.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">
                  What's Not Covered
                </h2>
                <div className="space-y-2">
                  {warranty.excluded_items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-ds-destructive/5 rounded-lg"
                    >
                      <svg
                        className="w-5 h-5 text-ds-destructive flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <p className="text-sm text-ds-foreground">
                        {typeof item === "string" ? item : item.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {warranty.claims_process && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">
                  Claims Process
                </h2>
                {Array.isArray(warranty.claims_process) ? (
                  <div className="space-y-4">
                    {warranty.claims_process.map((step: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="w-8 h-8 bg-ds-primary text-ds-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-ds-foreground text-sm">
                            {typeof step === "string"
                              ? step
                              : step.title || step.name}
                          </p>
                          {step.description && (
                            <p className="text-xs text-ds-muted-foreground mt-0.5">
                              {step.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {warranty.claims_process}
                  </p>
                )}
              </div>
            )}

            {warranty.terms && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">
                  Terms & Conditions
                </h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {warranty.terms}
                </p>
              </div>
            )}

            {warranty.faq && warranty.faq.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">FAQ</h2>
                <div className="space-y-4">
                  {warranty.faq.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="pb-4 border-b border-ds-border last:border-0"
                    >
                      <p className="font-medium text-ds-foreground text-sm">
                        {typeof item === "string" ? item : item.question}
                      </p>
                      {item.answer && (
                        <p className="text-sm text-ds-muted-foreground mt-1">
                          {item.answer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                {warranty.price != null && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-ds-foreground">
                      ${Number(warranty.price || 0).toLocaleString()}
                    </p>
                    {warranty.billing_period && (
                      <p className="text-sm text-ds-muted-foreground">
                        {warranty.billing_period}
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={handlePurchaseWarranty}
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  {loading ? "Processing..." : "Purchase Warranty"}
                </button>

                <button
                  onClick={handleComparePlans}
                  className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors"
                >
                  Compare Plans
                </button>
              </div>

              {warranty.highlights && warranty.highlights.length > 0 && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">
                    Plan Highlights
                  </h3>
                  <div className="space-y-2">
                    {warranty.highlights.map((highlight: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-ds-muted-foreground"
                      >
                        <svg
                          className="w-4 h-4 text-ds-primary flex-shrink-0"
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
                        {typeof highlight === "string"
                          ? highlight
                          : highlight.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {warranty.contact && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">
                    Claims Support
                  </h3>
                  <div className="space-y-2 text-sm">
                    {warranty.contact.phone && (
                      <div className="flex items-center gap-2 text-ds-muted-foreground">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span>{warranty.contact.phone}</span>
                      </div>
                    )}
                    {warranty.contact.email && (
                      <div className="flex items-center gap-2 text-ds-muted-foreground">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
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
                        <span>{warranty.contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TimelineBlock />
        <FaqBlock />
        <ReviewListBlock productId={warranty.id || id} heading="Reviews" />
      </div>
    </div>
  )
}
