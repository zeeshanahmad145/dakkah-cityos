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
import { LoyaltyPointsDisplayBlock } from "@/components/blocks/loyalty-points-display-block"
import { LoyaltyDashboardBlock } from "@/components/blocks/loyalty-dashboard-block"
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

export const Route = createFileRoute("/$tenant/$locale/loyalty-program/$id")({
  component: LoyaltyProgramDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.title || loaderData?.name || "Loyalty Program Details"} | Dakkah CityOS`,
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
        `${baseUrl}/store/loyalty/${params.id}`,
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

function LoyaltyProgramDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const baseUrl = getServerBaseUrl()
  const publishableKey = getMedusaPublishableKey()

  const loaderData = Route.useLoaderData()
  const program = loaderData?.item

  const handleJoinProgram = async () => {
    setLoading(true)
    try {
      const resp = await fetch(`${baseUrl}/store/loyalty`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": publishableKey,
        },
        credentials: "include",
        body: JSON.stringify({ loyalty_program_id: id }),
      })
      if (resp.ok) toast.success("Successfully joined the loyalty program!")
      else toast.error("Something went wrong. Please try again.")
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleLearnMore = () => {
    const aboutSection = document.querySelector('[data-section="about"]')
    if (aboutSection) aboutSection.scrollIntoView({ behavior: "smooth" })
    else toast.info("Scroll down to learn more about this program.")
  }

  if (!program) {
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
              Loyalty Program Not Found
            </h2>
            <p className="text-ds-muted-foreground mb-6">
              This loyalty program may have been removed or is no longer
              available.
            </p>
            <Link
              to={`${prefix}/loyalty-program` as never}
              className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors"
            >
              Browse Loyalty Programs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const details = [
    {
      label: t(
        locale,
        "loyaltyprogram.label_points_per_dollar",
        "Points Per Dollar",
      ),
      value: program.points_per_dollar || program.pointsPerDollar,
    },
    {
      label: t(locale, "loyaltyprogram.label_point_value", "Point Value"),
      value:
        program.point_value || program.pointValue
          ? `$${program.point_value || program.pointValue}`
          : null,
    },
    {
      label: t(
        locale,
        "loyaltyprogram.label_minimum_redemption",
        "Minimum Redemption",
      ),
      value:
        program.minimum_redemption || program.minimumRedemption
          ? `${program.minimum_redemption || program.minimumRedemption} points`
          : null,
    },
    {
      label: t(locale, "loyaltyprogram.label_expiration", "Expiration"),
      value: program.expiration || program.points_expiration,
    },
    {
      label: t(locale, "loyaltyprogram.label_status", "Status"),
      value: program.status,
    },
  ].filter((d) => d.value)

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
              to={`${prefix}/loyalty-program` as never}
              className="hover:text-ds-foreground transition-colors"
            >
              Loyalty Programs
            </Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">
              {program.name || program.title}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">
                {program.name || program.title}
              </h1>
              {(program.points_per_dollar || program.pointsPerDollar) && (
                <p className="text-xl font-semibold text-ds-primary mt-3">
                  Earn {program.points_per_dollar || program.pointsPerDollar}{" "}
                  points per $1 spent
                </p>
              )}
            </div>

            {program.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">
                  About This Program
                </h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {program.description}
                </p>
              </div>
            )}

            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <h2 className="font-semibold text-ds-foreground mb-4">
                Program Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {details.map((detail) => (
                  <div
                    key={detail.label}
                    className="bg-ds-muted/30 rounded-lg p-3"
                  >
                    <p className="text-xs text-ds-muted-foreground">
                      {detail.label}
                    </p>
                    <p className="font-medium text-ds-foreground mt-0.5">
                      {detail.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {program.tiers && program.tiers.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">
                  Membership Tiers
                </h2>
                <div className="space-y-3">
                  {program.tiers.map((tier: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-ds-muted/30 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-ds-foreground">
                          {tier.name || tier.title}
                        </p>
                        {tier.threshold && (
                          <p className="text-xs text-ds-muted-foreground mt-1">
                            {tier.threshold} points to qualify
                          </p>
                        )}
                      </div>
                      {tier.multiplier && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary/10 text-ds-primary">
                          {tier.multiplier}x points
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {program.benefits && program.benefits.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">
                  Benefits
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {program.benefits.map((benefit: string, idx: number) => (
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
                      {typeof benefit === "string"
                        ? benefit
                        : benefit.name || benefit.title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {program.how_to_earn && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">
                  How to Earn Points
                </h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {program.how_to_earn}
                </p>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-ds-muted-foreground mb-1">
                    Earn Up To
                  </p>
                  <p className="text-3xl font-bold text-ds-foreground">
                    {program.points_per_dollar ||
                      program.pointsPerDollar ||
                      "1"}
                    x
                  </p>
                  <p className="text-sm text-ds-muted-foreground">
                    points per dollar
                  </p>
                </div>

                <button
                  onClick={handleJoinProgram}
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
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                  {loading ? "Joining..." : "Join Program"}
                </button>

                <button
                  onClick={handleLearnMore}
                  className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2"
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Learn More
                </button>
              </div>

              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h3 className="font-semibold text-ds-foreground mb-3">
                  Quick Facts
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
                    Free to join
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
                    Earn on every purchase
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
                    Redeem for rewards and discounts
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoyaltyPointsDisplayBlock />
        <LoyaltyDashboardBlock />
      </div>
      <ReviewListBlock productId={program.id || id} heading="Reviews" />
    </div>
  )
}
