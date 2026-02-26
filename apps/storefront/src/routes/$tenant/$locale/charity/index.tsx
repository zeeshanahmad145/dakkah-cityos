// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/charity/")({
  component: CharityPage,
  head: () => ({
    meta: [
      { title: "Charity | Dakkah CityOS" },
      { name: "description", content: "Browse charitable causes on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/charity`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: [], count: 0 }
      const data = await resp.json()
      const raw = data.charities || data.campaigns || data.items || data.listings || data.products || []
      const items = raw.map((c: any) => {
        const meta = c.metadata || {}
        return {
          id: c.id,
          title: meta.title || c.title || c.name || meta.name || "Untitled Campaign",
          description: meta.description || c.description || "",
          campaign_type: meta.campaign_type || c.campaign_type || c.type || c.category || null,
          thumbnail: c.thumbnail || meta.thumbnail || meta.image || c.logo_url || c.thumbnail || null,
          goal: meta.goal || c.goal || c.target_amount || 0,
          raised: meta.raised || c.raised || c.amount_raised || c.current_amount || 0,
          donor_count: meta.donor_count || c.donor_count || c.backers || 0,
          organization: meta.organization || c.organization || c.organizer || null,
          currency: meta.currency || c.currency || "USD",
          end_date: meta.end_date || c.end_date || null,
          is_urgent: meta.is_urgent || c.is_urgent || false,
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const campaignTypeOptions = ["all", "one_time", "recurring", "emergency", "matching"] as const

const typeLabels: Record<string, string> = {
  one_time: "One Time",
  recurring: "Recurring",
  emergency: "Emergency",
  matching: "Matching",
}

const typeColors: Record<string, string> = {
  one_time: "bg-ds-info",
  recurring: "bg-ds-success",
  emergency: "bg-ds-destructive",
  matching: "bg-ds-primary",
}

function CharityPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.organization || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesType = typeFilter === "all" || (item.campaign_type || "").toLowerCase() === typeFilter
    return matchesSearch && matchesType
  })

  const formatAmount = (amount: number, currency: string) => {
    if (!amount) return `0 ${currency}`
    const val = amount >= 100 ? amount / 100 : amount
    return `${val.toLocaleString()} ${currency}`
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-success to-ds-success text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">Charity</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'charity.title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Make a difference — support causes that matter to you and help change lives.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} campaigns</span>
            <span>|</span>
            <span>100% transparent</span>
            <span>|</span>
            <span>{t(locale, "charity.badge_every_donation", "Every donation counts")}</span>
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
                  placeholder={t(locale, 'charity.search_placeholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">Campaign Type</label>
                <div className="space-y-1">
                  {campaignTypeOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setTypeFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${typeFilter === opt ? "bg-ds-primary text-ds-primary-foreground" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_types') : typeLabels[opt] || opt.charAt(0).toUpperCase() + opt.slice(1)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'charity.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'verticals.try_adjusting')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => {
                  const goal = item.goal || 0
                  const raised = item.raised || 0
                  const progress = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0
                  return (
                    <a
                      key={item.id}
                      href={`${prefix}/charity/${item.id}`}
                      className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-success/40 transition-all duration-200"
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-ds-success/10 to-ds-success/15 relative overflow-hidden">
                        {item.thumbnail ? (
                          <img loading="lazy" src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-ds-success/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          </div>
                        )}
                        {item.campaign_type && (
                          <span className={`absolute top-2 start-2 px-2 py-1 text-xs font-medium text-white rounded-md ${typeColors[item.campaign_type] || "bg-ds-success"}`}>
                            {typeLabels[item.campaign_type] || item.campaign_type}
                          </span>
                        )}
                        {item.is_urgent && (
                          <span className="absolute top-2 end-2 px-2 py-1 text-xs font-bold bg-ds-destructive text-white rounded-md">Urgent</span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-ds-foreground group-hover:text-ds-success transition-colors line-clamp-1">{item.title}</h3>
                        {item.organization && (
                          <p className="text-xs text-ds-muted-foreground mt-0.5">by {item.organization}</p>
                        )}
                        {item.description && (
                          <p className="text-sm text-ds-muted-foreground mt-1.5 line-clamp-2">{item.description}</p>
                        )}

                        <div className="mt-3">
                          <div className="w-full bg-ds-muted rounded-full h-2.5 overflow-hidden">
                            <div className="h-full bg-ds-success rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="flex justify-between mt-1.5 text-xs text-ds-muted-foreground">
                            <span className="font-medium text-ds-success">{formatAmount(raised, item.currency)} raised</span>
                            <span>{formatAmount(goal, item.currency)} goal</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-3 text-xs text-ds-muted-foreground">
                          {item.donor_count > 0 && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              {item.donor_count} donors
                            </span>
                          )}
                          {item.end_date && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              Ends {new Date(item.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>

                        <div className="pt-3 mt-3 border-t border-ds-border flex justify-between items-center">
                          <span className="text-sm font-medium text-ds-success">{Math.round(progress)}% funded</span>
                          <span className="px-3 py-1.5 text-xs font-semibold text-white bg-ds-success rounded-lg group-hover:bg-ds-success transition-colors">{t(locale, 'charity.donate_now')}</span>
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      <section className="py-16 bg-ds-card border-t border-ds-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">{t(locale, 'verticals.how_it_works')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">🎯</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Direct Impact</h3>
              <p className="text-sm text-ds-muted-foreground">100% of your donation goes directly to the cause you choose.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">📊</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Full Transparency</h3>
              <p className="text-sm text-ds-muted-foreground">Track exactly how funds are used with real-time progress updates.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">❤️</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Community Power</h3>
              <p className="text-sm text-ds-muted-foreground">Join thousands of donors making a difference together.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
