// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { t, formatCurrency, formatDate, type SupportedLocale } from "@/lib/i18n"
import { CampaignProgressBar } from "@/components/campaigns/campaign-progress-bar"
import { RewardTier } from "@/components/campaigns/reward-tier"
import { CountdownTimer } from "@/components/campaigns/countdown-timer"
import { CrowdfundingProgressBlock } from "@/components/blocks/crowdfunding-progress-block"

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

export const Route = createFileRoute("/$tenant/$locale/campaigns/$id")({
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/crowdfunding/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data.booking || data.event || data.auction || data) }
    } catch { return { item: null } }
  },
  component: CampaignDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Campaign Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
})

function CampaignDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const campaign = loaderData?.item

  if (!campaign) {
    return (
      <div className="min-h-screen bg-ds-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-ds-destructive mb-4">Campaign not found</p>
          <Link to={`${prefix}/campaigns` as any} className="text-ds-primary hover:underline">
            Back to Campaigns
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="relative h-64 md:h-80 bg-ds-muted overflow-hidden">
        {campaign.thumbnail ? (
          <img loading="lazy" src={campaign.thumbnail} alt={campaign.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ds-primary/20 to-ds-muted">
            <svg className="w-24 h-24 text-ds-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 start-0 end-0 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-white/80 mb-2">
              <Link to={`${prefix}` as any} className="hover:text-white transition-colors">
                {t(locale, "common.home")}
              </Link>
              <span>/</span>
              <Link to={`${prefix}/campaigns` as any} className="hover:text-white transition-colors">
                Campaigns
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{campaign.title}</h1>
            {campaign.creator_name && (
              <p className="text-white/80 mt-2">by {campaign.creator_name}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-ds-background rounded-lg border border-ds-border p-6 mb-8">
              <CampaignProgressBar
                raised={campaign.raised_amount}
                goal={campaign.goal_amount}
                currencyCode={campaign.currency_code}
                locale={locale}
              />

              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-ds-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-ds-foreground">
                    {formatCurrency(campaign.raised_amount, campaign.currency_code, locale as SupportedLocale)}
                  </p>
                  <p className="text-sm text-ds-muted-foreground">raised</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-ds-foreground">{campaign.backers_count}</p>
                  <p className="text-sm text-ds-muted-foreground">backers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-ds-foreground">{campaign.days_remaining}</p>
                  <p className="text-sm text-ds-muted-foreground">days left</p>
                </div>
              </div>

              {campaign.status === "active" && campaign.ends_at && (
                <div className="mt-6 pt-6 border-t border-ds-border flex justify-center">
                  <CountdownTimer endsAt={campaign.ends_at} variant="segmented" />
                </div>
              )}
            </div>

            {campaign.description && (
              <div className="bg-ds-background rounded-lg border border-ds-border p-6 mb-8">
                <h2 className="text-xl font-bold text-ds-foreground mb-4">About this project</h2>
                <div className="text-ds-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {campaign.description}
                </div>
              </div>
            )}

            {campaign.updates && campaign.updates.length > 0 && (
              <div className="bg-ds-background rounded-lg border border-ds-border p-6">
                <h2 className="text-xl font-bold text-ds-foreground mb-6">Updates</h2>
                <div className="space-y-6">
                  {campaign.updates.map((update) => (
                    <div key={update.id} className="relative ps-6 border-s-2 border-ds-border">
                      <div className="absolute -start-[5px] top-0 w-2 h-2 rounded-full bg-ds-primary" />
                      <p className="text-xs text-ds-muted-foreground mb-1">
                        {formatDate(update.created_at, locale as SupportedLocale)}
                      </p>
                      <h3 className="font-semibold text-ds-foreground">{update.title}</h3>
                      <p className="text-sm text-ds-muted-foreground mt-1">{update.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            {campaign.reward_tiers && campaign.reward_tiers.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-ds-foreground mb-4">Reward Tiers</h2>
                <div className="space-y-4">
                  {campaign.reward_tiers.map((tier) => (
                    <RewardTier
                      key={tier.id}
                      id={tier.id}
                      title={tier.title}
                      description={tier.description}
                      pledgeAmount={tier.pledge_amount}
                      currencyCode={tier.currency_code}
                      estimatedDelivery={tier.estimated_delivery}
                      limitedQuantity={tier.limited_quantity}
                      claimed={tier.claimed}
                      includes={tier.includes}
                      onPledge={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CrowdfundingProgressBlock />
      </div>
    </div>
  )
}
