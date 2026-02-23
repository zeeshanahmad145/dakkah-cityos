// @ts-nocheck
import { t } from "@/lib/i18n"
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/$tenant/$locale/memberships/")({
  component: MembershipsPage,
  head: () => ({
    meta: [
      { title: "Memberships | Dakkah CityOS" },
      { name: "description", content: "Browse memberships on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/memberships`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: [], count: 0 }
      const data = await resp.json()
      const raw = data.memberships || data.tiers || data.plans || data.items || []
      const items = raw.map((m: any) => {
        const meta = m.metadata || {}
        return {
          id: m.id,
          name: meta.name || m.name || m.tier_name || "Untitled Plan",
          tier: meta.tier || m.tier || m.tier_type || null,
          description: meta.description || m.description || "",
          benefits: meta.benefits || m.benefits || [],
          price: meta.price || m.price || null,
          currency: meta.currency || m.currency || "USD",
          interval: meta.interval || m.billing_interval || "monthly",
          thumbnail: meta.thumbnail || meta.image || m.logo_url || null,
          is_popular: meta.is_popular || m.is_popular || false,
          max_members: meta.max_members || m.max_members || null,
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const tierOptions = ["all", "bronze", "silver", "gold", "platinum"] as const

const tierColors: Record<string, string> = {
  bronze: "from-ds-warning to-ds-warning/90",
  silver: "from-ds-muted-foreground to-ds-muted-foreground/80",
  gold: "from-ds-warning to-ds-warning",
  platinum: "from-ds-primary to-ds-primary",
}

const tierIcons: Record<string, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "💎",
}

function MembershipsPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [tierFilter, setTierFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesTier = tierFilter === "all" || (item.tier || "").toLowerCase() === tierFilter
    return matchesSearch && matchesTier
  })

  const formatPrice = (price: number | null, currency: string, interval: string) => {
    if (!price) return "Free"
    const amount = price >= 100 ? price / 100 : price
    return `${amount.toLocaleString()} ${currency}/${interval}`
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-warning to-ds-warning text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">Memberships</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'memberships.title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Unlock exclusive benefits, discounts, and premium access with our membership tiers.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} plans available</span>
            <span>|</span>
            <span>{t(locale, "memberships.badge_cancel_anytime", "Cancel anytime")}</span>
            <span>|</span>
            <span>{t(locale, "memberships.badge_exclusive_perks", "Exclusive perks")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'verticals.search_label')}</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(locale, 'memberships.search_placeholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'verticals.tier_label')}</label>
                <div className="space-y-1">
                  {tierOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setTierFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${tierFilter === opt ? "bg-ds-primary text-ds-primary-foreground" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_tiers') : `${tierIcons[opt] || ""} ${opt.charAt(0).toUpperCase() + opt.slice(1)}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            {filteredItems.length === 0 ? (
              <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
                <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'memberships.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'verticals.try_adjusting')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => {
                  const tierKey = (item.tier || "").toLowerCase()
                  const gradient = tierColors[tierKey] || "from-ds-warning to-ds-warning"
                  return (
                    <div
                      key={item.id}
                      className={`group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-warning/40 transition-all duration-200 ${item.is_popular ? "ring-2 ring-ds-warning" : ""}`}
                    >
                      <div className={`bg-gradient-to-br ${gradient} p-6 text-white text-center relative`}>
                        {item.is_popular && (
                          <span className="absolute top-2 end-2 px-2 py-1 text-xs font-bold bg-ds-card text-ds-warning rounded-full">Popular</span>
                        )}
                        <div className="text-4xl mb-2">{tierIcons[tierKey] || "⭐"}</div>
                        <h3 className="text-xl font-bold">{item.name}</h3>
                        {item.tier && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-ds-card/20 rounded-full capitalize">{item.tier}</span>
                        )}
                      </div>
                      <div className="p-5">
                        {item.description && (
                          <p className="text-sm text-ds-muted-foreground mb-4 line-clamp-2">{item.description}</p>
                        )}

                        {item.benefits && item.benefits.length > 0 && (
                          <ul className="space-y-2 mb-4">
                            {item.benefits.slice(0, 5).map((b: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-ds-foreground">
                                <svg className="w-4 h-4 text-ds-warning mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                {b}
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t border-ds-border">
                          <span className="font-bold text-ds-warning text-lg">
                            {formatPrice(item.price, item.currency, item.interval)}
                          </span>
                          <button className="px-4 py-2 text-xs font-semibold text-white bg-ds-warning rounded-lg hover:bg-ds-warning transition-colors">
                            {t(locale, 'memberships.join_now')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      <section className="py-16 bg-ds-card border-t border-ds-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">Why Join?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-warning text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">🎁</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Exclusive Perks</h3>
              <p className="text-sm text-ds-muted-foreground">Access members-only discounts, early releases, and special events.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-warning text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">📈</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Tier Up Rewards</h3>
              <p className="text-sm text-ds-muted-foreground">The more you engage, the higher your tier — unlock bigger benefits.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-warning text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">🔄</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Flexible Plans</h3>
              <p className="text-sm text-ds-muted-foreground">Upgrade, downgrade, or cancel your membership anytime with no hassle.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
