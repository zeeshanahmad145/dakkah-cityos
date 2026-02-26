// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { SubscriptionManageBlock } from "@/components/blocks/subscription-manage-block"
import { ReviewListBlock } from '@/components/blocks/review-list-block'

function normalizeDetail(item: any) {
  if (!item) return null
  const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {})
  return { ...meta, ...item,
    thumbnail: item.thumbnail || item.image_url || item.photo_url || item.banner_url || item.logo_url || meta.thumbnail || (meta.images && meta.images[0]) || null,
    images: meta.images || [item.photo_url || item.banner_url || item.logo_url].filter(Boolean),
    description: item.description || meta.description || "",
    price: item.price ?? meta.price ?? null,
    rating: item.rating ?? item.avg_rating ?? meta.rating ?? null,
    review_count: item.review_count ?? meta.review_count ?? null,
    location: item.location || item.city || item.address || meta.location || null,
  }
}

export const Route = createFileRoute("/$tenant/$locale/subscriptions/$id")({
  component: SubscriptionDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Subscription Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/subscriptions/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

function SubscriptionDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const plan = loaderData?.item

  if (!plan) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Subscription Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This subscription plan may have been removed or is no longer available.</p>
            <Link to={`${prefix}/subscriptions` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Subscriptions
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const features = plan.features || plan.included_features || []
  const period = plan.billing_period || plan.interval || plan.period || "month"

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <Link to={`${prefix}/subscriptions` as any} className="hover:text-ds-foreground transition-colors">Subscriptions</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{plan.title || plan.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {plan.thumbnail || plan.image ? (
                <img loading="lazy" src={plan.thumbnail || plan.image} alt={plan.title || plan.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ds-primary/10 to-ds-primary/15">
                  <svg className="w-16 h-16 text-ds-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              )}
              {plan.popular && (
                <span className="absolute top-4 start-4 px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary text-white">
                  Most Popular
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{plan.title || plan.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {plan.price != null && (
                  <span className="text-2xl font-bold text-ds-primary">
                    ${Number(plan.price || 0).toLocaleString()}<span className="text-base font-normal text-ds-muted-foreground">/{period}</span>
                  </span>
                )}
                {plan.tier && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-ds-muted text-ds-muted-foreground">{plan.tier}</span>
                )}
              </div>
            </div>

            {plan.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Plan Overview</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{plan.description}</p>
              </div>
            )}

            {features.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Features</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((feature: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-ds-muted-foreground">
                      <svg className="w-4 h-4 mt-0.5 text-ds-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span>{typeof feature === "string" ? feature : feature.name || feature.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plan.included && plan.included.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">What's Included</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plan.included.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                      <svg className="w-4 h-4 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plan.cancel_policy && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Cancellation Policy</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{plan.cancel_policy}</p>
              </div>
            )}

            {plan.faq && plan.faq.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {plan.faq.map((item: any, idx: number) => (
                    <div key={idx}>
                      <h3 className="font-medium text-ds-foreground text-sm">{item.question}</h3>
                      <p className="text-sm text-ds-muted-foreground mt-1">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-ds-muted-foreground">Subscription Price</p>
                  <p className="text-3xl font-bold text-ds-foreground">
                    {plan.price != null ? `$${Number(plan.price || 0).toLocaleString()}` : "Free"}
                  </p>
                  <p className="text-sm text-ds-muted-foreground">per {period}</p>
                  {plan.annual_price && (
                    <p className="text-xs text-ds-muted-foreground mt-1">
                      or ${Number(plan.annual_price || 0).toLocaleString()}/year (save {plan.annual_savings || "~17%"})
                    </p>
                  )}
                </div>

                <button className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Subscribe Now
                </button>

                {plan.trial_days && (
                  <p className="text-center text-sm text-ds-muted-foreground">
                    {plan.trial_days}-day free trial included
                  </p>
                )}

                <button className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Compare Plans
                </button>
              </div>

              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h3 className="font-semibold text-ds-foreground mb-3">Plan Details</h3>
                <div className="space-y-2 text-sm">
                  {period && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Billing</span>
                      <span className="text-ds-foreground font-medium capitalize">{period}ly</span>
                    </div>
                  )}
                  {plan.trial_days && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Free Trial</span>
                      <span className="text-ds-foreground font-medium">{plan.trial_days} days</span>
                    </div>
                  )}
                  {plan.users && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Users</span>
                      <span className="text-ds-foreground font-medium">{plan.users}</span>
                    </div>
                  )}
                  {plan.storage && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Storage</span>
                      <span className="text-ds-foreground font-medium">{plan.storage}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-ds-primary/10 border border-ds-primary/30 rounded-xl p-6">
                <h3 className="font-semibold text-ds-primary mb-2">Cancel Anytime</h3>
                <p className="text-sm text-ds-primary">No long-term contracts. You can cancel, upgrade, or downgrade your plan at any time.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubscriptionManageBlock subscriptionId={plan.id} />
        <ReviewListBlock productId={plan.id || id} heading="Reviews" />
      </div>
    </div>
  )
}
