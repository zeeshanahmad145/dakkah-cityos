// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ReferralProgramBlock } from "@/components/blocks/referral-program-block"
import { ReviewListBlock } from "@/components/blocks/review-list-block"

function normalizeDetail(item: any) {
  if (!item) return null
  const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {})
  return { ...meta, ...item,
    thumbnail: item.thumbnail || item.photo_url || item.banner_url || item.logo_url || meta.thumbnail || (meta.images && meta.images[0]) || null,
    images: meta.images || [item.photo_url || item.banner_url || item.logo_url].filter(Boolean),
    description: item.description || meta.description || "",
    price: item.price ?? meta.price ?? null,
    rating: item.rating ?? item.avg_rating ?? meta.rating ?? null,
    review_count: item.review_count ?? meta.review_count ?? null,
    location: item.location || item.city || item.address || meta.location || null,
  }
}

export const Route = createFileRoute("/$tenant/$locale/affiliate/$id")({
  component: AffiliateDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Affiliate Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/affiliate/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

function AffiliateDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const program = loaderData?.item

  if (!program) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Affiliate Program Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This affiliate program may have been removed or is no longer available.</p>
            <Link to={`${prefix}/affiliate` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Affiliate Programs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const details = [
    { label: t(locale, "affiliate.label_commission_rate", "Commission Rate"), value: program.commission_rate ? `${program.commission_rate}%` : program.commissionRate ? `${program.commissionRate}%` : null },
    { label: t(locale, "affiliate.label_cookie_duration", "Cookie Duration"), value: program.cookie_duration || program.cookieDuration ? `${program.cookie_duration || program.cookieDuration} days` : null },
    { label: t(locale, "affiliate.label_payout_schedule", "Payout Schedule"), value: program.payout_schedule || program.payoutSchedule },
    { label: t(locale, "affiliate.label_minimum_payout", "Minimum Payout"), value: program.minimum_payout != null ? `$${Number(program.minimum_payout || 0).toLocaleString()}` : program.minimumPayout != null ? `$${Number(program.minimumPayout || 0).toLocaleString()}` : null },
    { label: t(locale, "affiliate.label_payment_method", "Payment Method"), value: program.payment_method || program.paymentMethod },
    { label: t(locale, "affiliate.label_status", "Status"), value: program.status },
  ].filter((d) => d.value)

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <Link to={`${prefix}/affiliate` as any} className="hover:text-ds-foreground transition-colors">Affiliate Programs</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{program.name || program.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{program.name || program.title}</h1>
              {program.commission_rate || program.commissionRate ? (
                <p className="text-2xl font-bold text-ds-primary mt-3">
                  {program.commission_rate || program.commissionRate}% Commission
                </p>
              ) : null}
            </div>

            {program.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Program Overview</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{program.description}</p>
              </div>
            )}

            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <h2 className="font-semibold text-ds-foreground mb-4">Program Details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {details.map((detail) => (
                  <div key={detail.label} className="bg-ds-muted/30 rounded-lg p-3">
                    <p className="text-xs text-ds-muted-foreground">{detail.label}</p>
                    <p className="font-medium text-ds-foreground mt-0.5">{detail.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {program.terms && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Terms & Conditions</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{program.terms}</p>
              </div>
            )}

            {program.benefits && program.benefits.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Benefits</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {program.benefits.map((benefit: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                      <svg className="w-4 h-4 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {benefit}
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
                  <p className="text-sm text-ds-muted-foreground mb-1">Commission Rate</p>
                  <p className="text-3xl font-bold text-ds-foreground">
                    {program.commission_rate || program.commissionRate ? `${program.commission_rate || program.commissionRate}%` : "Varies"}
                  </p>
                </div>

                <button className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  Join Program
                </button>

                <button className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Contact Support
                </button>
              </div>

              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h3 className="font-semibold text-ds-foreground mb-3">How It Works</h3>
                <ul className="space-y-3 text-sm text-ds-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-ds-primary/10 text-ds-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    Sign up for the affiliate program
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-ds-primary/10 text-ds-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    Share your unique referral link
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-ds-primary/10 text-ds-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    Earn commissions on referrals
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReferralProgramBlock />
        <ReviewListBlock productId={program.id} />
      </div>
    </div>
  )
}
