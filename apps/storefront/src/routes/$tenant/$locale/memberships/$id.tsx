// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { t, formatCurrency } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/i18n"
import { BenefitsList } from "@/components/memberships/benefits-list"
import { MembershipTiersBlock } from "@/components/blocks/membership-tiers-block"
import { FaqBlock } from "@/components/blocks/faq-block"

function normalizeDetail(item: any) {
  if (!item) return null
  const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {})
  const rawPrice = item.price ?? meta.price ?? null
  const currency = item.currency || item.currency_code || meta.currency || meta.currency_code || "USD"
  const priceObj = rawPrice != null
    ? (typeof rawPrice === 'object' && rawPrice.amount != null ? rawPrice : { amount: Number(rawPrice), currencyCode: currency })
    : null
  return { ...meta, ...item,
    thumbnail: item.thumbnail || item.photo_url || item.banner_url || item.logo_url || meta.thumbnail || (meta.images && meta.images[0]) || null,
    images: meta.images || [item.photo_url || item.banner_url || item.logo_url].filter(Boolean),
    description: item.description || meta.description || "",
    price: priceObj,
    currency,
    billingPeriod: item.billingPeriod || item.billing_period || meta.billingPeriod || meta.billing_period || "monthly",
    trialDays: item.trialDays ?? item.trial_days ?? meta.trialDays ?? meta.trial_days ?? null,
    isPopular: item.isPopular ?? item.is_popular ?? meta.isPopular ?? meta.is_popular ?? false,
    benefits: item.benefits || meta.benefits || [],
    rating: item.rating ?? item.avg_rating ?? meta.rating ?? null,
    review_count: item.review_count ?? meta.review_count ?? null,
    location: item.location || item.city || item.address || meta.location || null,
  }
}

export const Route = createFileRoute("/$tenant/$locale/memberships/$id")({
  component: MembershipDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Membership Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/memberships/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

const billingLabels: Record<string, string> = {
  monthly: "blocks.per_month",
  yearly: "blocks.per_year",
  lifetime: "membership.lifetime",
}

function MembershipDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const loc = locale as SupportedLocale

  const loaderData = Route.useLoaderData()
  const tier = loaderData?.item

  if (!tier) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
              {t(locale, "membership.title")}
            </p>
            <Link
              to={`${prefix}/memberships` as any}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90 transition-colors"
            >
              {t(locale, "membership.browse_plans")}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-ds-muted-foreground mb-8">
          <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">
            {t(locale, "common.home")}
          </Link>
          <span>/</span>
          <Link to={`${prefix}/memberships` as any} className="hover:text-ds-foreground transition-colors">
            {t(locale, "membership.title")}
          </Link>
          <span>/</span>
          <span className="text-ds-foreground">{tier.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-ds-foreground">{tier.name}</h1>
                {tier.isPopular && (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary/20 text-ds-primary">
                    {t(locale, "blocks.most_popular")}
                  </span>
                )}
              </div>
              {tier.description && (
                <p className="text-ds-muted-foreground">{tier.description}</p>
              )}
            </div>

            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-ds-foreground mb-4">
                {t(locale, "membership.benefits")}
              </h2>
              <BenefitsList benefits={tier.benefits} showAll variant="grid" />
            </div>

            {tier.trialDays && (
              <div className="bg-ds-primary/5 border border-ds-primary/20 rounded-xl p-4 flex items-center gap-3">
                <svg className="w-6 h-6 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-ds-foreground">
                  Start with a {tier.trialDays}-day free trial. Cancel anytime.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-ds-background border border-ds-border rounded-xl p-6 sticky top-4 space-y-6">
              <div className="text-center">
                <span className="text-4xl font-bold text-ds-foreground">
                  {tier.price ? formatCurrency(tier.price.amount, tier.price.currencyCode, loc) : ""}
                </span>
                <span className="text-ds-muted-foreground ms-1">
                  {t(locale, billingLabels[tier.billingPeriod] || "blocks.per_month")}
                </span>
              </div>

              <button className="w-full px-6 py-3 text-sm font-semibold rounded-lg bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90 transition-colors">
                {t(locale, "blocks.get_started")}
              </button>

              <Link
                to={`${prefix}/memberships` as any}
                className="block w-full text-center px-4 py-2 text-sm font-medium text-ds-muted-foreground hover:text-ds-foreground transition-colors"
              >
                {t(locale, "membership.compare_plans")}
              </Link>

              <div className="border-t border-ds-border pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                  <svg className="w-4 h-4 text-ds-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{t(locale, "memberships.badge_cancel_anytime", "Cancel anytime")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                  <svg className="w-4 h-4 text-ds-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{t(locale, "memberships.badge_secure_payment", "Secure payment")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                  <svg className="w-4 h-4 text-ds-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{t(locale, "memberships.badge_instant_access", "Instant access")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MembershipTiersBlock />
        <FaqBlock />
      </div>
    </div>
  )
}
