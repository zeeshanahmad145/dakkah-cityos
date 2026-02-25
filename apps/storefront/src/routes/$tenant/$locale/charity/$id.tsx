// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { DonationCampaignBlock } from "@/components/blocks/donation-campaign-block"
import { ReviewListBlock } from "@/components/blocks/review-list-block"

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

export const Route = createFileRoute("/$tenant/$locale/charity/$id")({
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/charity/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data.booking || data.event || data.auction || data) }
    } catch { return { item: null } }
  },
  component: CharityDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Charity Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
})

function CharityDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const campaign = loaderData?.item

  if (!campaign) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Campaign Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This charity campaign may have been removed or is no longer available.</p>
            <Link to={`${prefix}/charity` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Campaigns
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const goal = Number(campaign.goal || campaign.target_amount || 0)
  const raised = Number(campaign.raised || campaign.current_amount || 0)
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <Link to={`${prefix}/charity` as any} className="hover:text-ds-foreground transition-colors">Charity</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{campaign.name || campaign.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {campaign.thumbnail || campaign.image ? (
                <img loading="lazy" src={campaign.thumbnail || campaign.image} alt={campaign.name || campaign.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-ds-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              )}
              {campaign.category && (
                <span className="absolute top-4 start-4 px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary text-ds-primary-foreground">{campaign.category}</span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{campaign.name || campaign.title}</h1>
              {campaign.organizer && (
                <p className="mt-2 text-sm text-ds-muted-foreground">
                  Organized by <span className="font-medium text-ds-foreground">{typeof campaign.organizer === "string" ? campaign.organizer : campaign.organizer.name}</span>
                </p>
              )}
            </div>

            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <div className="flex items-end justify-between mb-2">
                <div>
                  <span className="text-2xl font-bold text-ds-primary">${Number(raised || 0).toLocaleString()}</span>
                  <span className="text-sm text-ds-muted-foreground ms-1">raised of ${Number(goal || 0).toLocaleString()} goal</span>
                </div>
                <span className="text-sm font-medium text-ds-foreground">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-ds-muted rounded-full h-3 overflow-hidden">
                <div className="bg-ds-primary h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-ds-muted-foreground">
                {campaign.donor_count != null && (
                  <span>{campaign.donor_count} donors</span>
                )}
                {campaign.days_left != null && (
                  <span>{campaign.days_left} days left</span>
                )}
              </div>
            </div>

            {campaign.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">About This Campaign</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{campaign.description}</p>
              </div>
            )}

            {campaign.updates && campaign.updates.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Updates</h2>
                <div className="space-y-4">
                  {campaign.updates.map((update: any, idx: number) => (
                    <div key={idx} className="relative ps-6 pb-4 border-l-2 border-ds-border last:pb-0">
                      <div className="absolute -start-[5px] top-1 w-2 h-2 bg-ds-primary rounded-full" />
                      <div className="mb-1">
                        <span className="text-xs text-ds-muted-foreground">
                          {update.date ? new Date(update.date).toLocaleDateString() : `Update ${idx + 1}`}
                        </span>
                      </div>
                      {update.title && (
                        <h3 className="font-medium text-ds-foreground text-sm">{update.title}</h3>
                      )}
                      <p className="text-sm text-ds-muted-foreground mt-1">{update.content || update.text || update.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {campaign.donors && campaign.donors.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Recent Donors</h2>
                <div className="space-y-3">
                  {campaign.donors.map((donor: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-ds-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-ds-primary/10 rounded-full flex items-center justify-center text-ds-primary font-semibold text-sm">
                          {(donor.name || "A").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-ds-foreground text-sm">{donor.name || "Anonymous"}</p>
                          {donor.date && <p className="text-xs text-ds-muted-foreground">{new Date(donor.date).toLocaleDateString()}</p>}
                        </div>
                      </div>
                      {donor.amount != null && (
                        <span className="font-medium text-ds-primary text-sm">${Number(donor.amount || 0).toLocaleString()}</span>
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
                <button className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2 text-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  Donate Now
                </button>

                <button className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  Share Campaign
                </button>
              </div>

              {campaign.organizer && typeof campaign.organizer === "object" && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Organizer</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-ds-primary/10 rounded-full flex items-center justify-center text-ds-primary font-semibold">
                      {(campaign.organizer.name || "O").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-ds-foreground">{campaign.organizer.name}</p>
                      {campaign.organizer.location && (
                        <p className="text-sm text-ds-muted-foreground">{campaign.organizer.location}</p>
                      )}
                    </div>
                  </div>
                  {campaign.organizer.description && (
                    <p className="text-sm text-ds-muted-foreground mt-3">{campaign.organizer.description}</p>
                  )}
                </div>
              )}

              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h3 className="font-semibold text-ds-foreground mb-3">Campaign Details</h3>
                <div className="space-y-2 text-sm">
                  {campaign.created_at && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Created</span>
                      <span className="text-ds-foreground font-medium">{new Date(campaign.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {campaign.end_date && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Ends</span>
                      <span className="text-ds-foreground font-medium">{new Date(campaign.end_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {campaign.category && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">{t(locale, 'verticals.category_label')}</span>
                      <span className="text-ds-foreground font-medium">{campaign.category}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DonationCampaignBlock campaignId={campaign.id} />
        <ReviewListBlock productId={campaign.id} />
      </div>
    </div>
  )
}
