// @ts-nocheck
import { useState } from "react"
import {
  getServerBaseUrl,
  fetchWithTimeout,
  getMedusaPublishableKey,
} from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useToast } from "@/components/ui/toast"
import { ComparisonTableBlock } from "@/components/blocks/comparison-table-block"
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

export const Route = createFileRoute("/$tenant/$locale/insurance/$id")({
  component: InsuranceDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.title || loaderData?.name || "Insurance Details"} | Dakkah CityOS`,
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
        `${baseUrl}/store/insurance/${params.id}`,
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

function InsuranceDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const toast = useToast()
  const [quoting, setQuoting] = useState(false)

  const loaderData = Route.useLoaderData()
  const plan = loaderData?.item

  const handleGetQuote = async () => {
    setQuoting(true)
    try {
      const baseUrl = getServerBaseUrl()
      const publishableKey = getMedusaPublishableKey()
      const resp = await fetch(`${baseUrl}/store/insurance/policies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": publishableKey,
        },
        credentials: "include",
        body: JSON.stringify({ plan_id: id }),
      })
      if (resp.ok)
        toast.success("Quote generated! Check your email for details.")
      else toast.error("Something went wrong. Please try again.")
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setQuoting(false)
    }
  }

  const handleComparePlans = () => {
    toast.info("Scroll down to compare all available plans.")
  }

  if (!plan) {
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
              Plan Not Found
            </h2>
            <p className="text-ds-muted-foreground mb-6">
              This insurance plan may have been removed or is no longer
              available.
            </p>
            <Link
              to={`${prefix}/insurance` as never}
              className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors"
            >
              Browse Insurance Plans
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const typeLabels: Record<string, string> = {
    health: "Health Insurance",
    auto: "Auto Insurance",
    home: "Home Insurance",
    life: "Life Insurance",
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
              to={`${prefix}/insurance` as never}
              className="hover:text-ds-foreground transition-colors"
            >
              Insurance
            </Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">
              {plan.name || plan.title}
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
                    {plan.name || plan.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {plan.type && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary/10 text-ds-primary">
                        {typeLabels[plan.type] || plan.type}
                      </span>
                    )}
                    {plan.provider && (
                      <span className="text-sm text-ds-muted-foreground">
                        by {plan.provider}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {plan.premium != null && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">
                    Premium
                  </p>
                  <p className="text-lg font-bold text-ds-foreground">
                    ${Number(plan.premium || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-ds-muted-foreground">/month</p>
                </div>
              )}
              {plan.deductible != null && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">
                    Deductible
                  </p>
                  <p className="text-lg font-bold text-ds-foreground">
                    ${Number(plan.deductible || 0).toLocaleString()}
                  </p>
                </div>
              )}
              {plan.coverage_amount != null && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">
                    Coverage
                  </p>
                  <p className="text-lg font-bold text-ds-foreground">
                    ${Number(plan.coverage_amount || 0).toLocaleString()}
                  </p>
                </div>
              )}
              {plan.rating && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">
                    Rating
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <svg
                      className="w-4 h-4 text-ds-warning"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-lg font-bold text-ds-foreground">
                      {plan.rating}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {plan.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">
                  Plan Details
                </h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {plan.description}
                </p>
              </div>
            )}

            {plan.coverage_details && plan.coverage_details.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">
                  Coverage Details
                </h2>
                <div className="space-y-3">
                  {plan.coverage_details.map((detail: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-ds-muted/30 rounded-lg"
                    >
                      <svg
                        className="w-5 h-5 text-ds-primary flex-shrink-0 mt-0.5"
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
                        <p className="font-medium text-ds-foreground text-sm">
                          {typeof detail === "string" ? detail : detail.name}
                        </p>
                        {detail.description && (
                          <p className="text-xs text-ds-muted-foreground mt-0.5">
                            {detail.description}
                          </p>
                        )}
                        {detail.limit && (
                          <p className="text-xs text-ds-primary mt-0.5">
                            Limit: {detail.limit}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plan.exclusions && plan.exclusions.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">
                  Exclusions
                </h2>
                <div className="space-y-2">
                  {plan.exclusions.map((exclusion: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-ds-muted-foreground"
                    >
                      <svg
                        className="w-4 h-4 text-ds-destructive flex-shrink-0"
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
                      {typeof exclusion === "string"
                        ? exclusion
                        : exclusion.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plan.terms && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">
                  Terms & Conditions
                </h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {plan.terms}
                </p>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                {plan.premium != null && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-ds-foreground">
                      ${Number(plan.premium || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-ds-muted-foreground">
                      per month
                    </p>
                  </div>
                )}

                <button
                  onClick={handleGetQuote}
                  disabled={quoting}
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {quoting ? "Generating Quote..." : "Get Quote"}
                </button>

                <button
                  onClick={handleComparePlans}
                  className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors"
                >
                  Compare Plans
                </button>
              </div>

              {plan.features && (plan.features as string[]).length > 0 && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">
                    Key Features
                  </h3>
                  <div className="space-y-2">
                    {(plan.features as string[]).map((feature: any, idx: number) => (
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
                        {typeof feature === "string" ? feature : feature.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plan.provider_info && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">
                    Provider
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-ds-primary/10 rounded-full flex items-center justify-center text-ds-primary font-semibold">
                      {(plan.provider_info.name || plan.provider || "P")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-ds-foreground text-sm">
                        {plan.provider_info.name || plan.provider}
                      </p>
                      {plan.provider_info.rating && (
                        <p className="text-xs text-ds-muted-foreground">
                          Rating: {plan.provider_info.rating}/5
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ComparisonTableBlock />
        <FaqBlock />
      </div>
      <ReviewListBlock productId={plan.id || id} heading="Reviews" />
    </div>
  )
}
