// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"

export const Route = createFileRoute("/$tenant/$locale/campaigns/")({
  component: CampaignsPage,
  head: () => ({
    meta: [
      { title: "Crowdfunding Campaigns | Dakkah CityOS" },
      { name: "description", content: "Discover and support innovative crowdfunding campaigns on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/crowdfunding`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: [], count: 0 }
      const data = await resp.json()
      const raw = data.items || data.campaigns || []
      const items = raw.map((c: any) => ({
        id: c.id,
        title: c.title || c.name || "Untitled Campaign",
        description: c.description || c.short_description || "",
        short_description: c.short_description || "",
        category: c.category || null,
        campaign_type: c.campaign_type || null,
        status: c.status || "active",
        goal_amount: c.goal_amount || 0,
        current_amount: c.current_amount || c.raised_amount || 0,
        currency_code: c.currency_code || "USD",
        backer_count: c.backer_count || 0,
        starts_at: c.starts_at || null,
        ends_at: c.ends_at || null,
        thumbnail: c.thumbnail || c.image || null,
        is_flexible_funding: c.is_flexible_funding || false,
      }))
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const categoryOptions = ["all", "technology", "arts", "education", "sustainability"] as const

const categoryColors: Record<string, string> = {
  technology: "bg-ds-primary",
  arts: "bg-purple-500",
  education: "bg-ds-success",
  sustainability: "bg-emerald-500",
}

function formatAmount(amount: number, currencyCode: string) {
  const value = amount >= 100 ? amount / 100 : amount
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function getDaysRemaining(endsAt: string | null) {
  if (!endsAt) return null
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function CampaignsPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary to-ds-primary/80 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">{t(locale, 'crowdfunding.breadcrumb')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'crowdfunding.hero_title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, 'crowdfunding.description')}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} {t(locale, 'crowdfunding.active_campaigns')}</span>
            <span>|</span>
            <span>{t(locale, 'crowdfunding.back_project')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'crowdfunding.search_label')}</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(locale, 'crowdfunding.search_placeholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'crowdfunding.filter_category')}</label>
                <div className="space-y-1">
                  {categoryOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setCategoryFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${categoryFilter === opt ? "bg-ds-primary text-ds-primary-foreground" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_categories') : opt.charAt(0).toUpperCase() + opt.slice(1)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'crowdfunding.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'crowdfunding.no_results_hint')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => {
                  const progressPercent = item.goal_amount > 0
                    ? Math.min(Math.round((item.current_amount / item.goal_amount) * 100), 100)
                    : 0
                  const daysLeft = getDaysRemaining(item.ends_at)

                  return (
                    <Link
                      key={item.id}
                      to={`${prefix}/campaigns/${item.id}` as any}
                      className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-primary/40 transition-all duration-200"
                    >
                      <div className="aspect-[16/10] bg-gradient-to-br from-ds-primary/10 to-ds-muted relative overflow-hidden">
                        {item.thumbnail ? (
                          <img loading="lazy" src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-ds-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                        {item.campaign_type && (
                          <span className="absolute top-2 start-2 px-2.5 py-1 text-xs font-bold bg-ds-primary text-white rounded-md capitalize">
                            {item.campaign_type}
                          </span>
                        )}
                        {item.category && (
                          <span className={`absolute top-2 end-2 px-2 py-1 text-xs font-medium text-white rounded-md capitalize ${categoryColors[item.category] || "bg-ds-muted-foreground"}`}>
                            {item.category}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-ds-foreground group-hover:text-ds-primary transition-colors line-clamp-1">{item.title}</h3>
                        {(item.short_description || item.description) && (
                          <p className="text-sm text-ds-muted-foreground mt-1.5 line-clamp-2">{item.short_description || item.description}</p>
                        )}

                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-ds-muted-foreground mb-1">
                            <span>{progressPercent}% {t(locale, 'crowdfunding.funded')}</span>
                            <span>{t(locale, 'crowdfunding.goal')}: {formatAmount(item.goal_amount, item.currency_code)}</span>
                          </div>
                          <div className="w-full bg-ds-border rounded-full h-2.5">
                            <div
                              className="bg-gradient-to-r from-ds-primary to-ds-success h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 text-lg font-bold text-ds-primary">
                          {formatAmount(item.current_amount, item.currency_code)} <span className="text-sm font-normal text-ds-muted-foreground">{t(locale, 'crowdfunding.raised')}</span>
                        </div>

                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-ds-border text-xs text-ds-muted-foreground">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            {item.backer_count} {t(locale, 'crowdfunding.backers')}
                          </span>
                          {daysLeft !== null && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {daysLeft} {t(locale, 'crowdfunding.days_left')}
                            </span>
                          )}
                          {item.is_flexible_funding && (
                            <span className="text-ds-success font-medium">Flexible</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      <section className="py-16 bg-ds-card border-t border-ds-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">{t(locale, 'crowdfunding.how_it_works_title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'crowdfunding.step1_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'crowdfunding.step1_desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'crowdfunding.step2_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'crowdfunding.step2_desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'crowdfunding.step3_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'crowdfunding.step3_desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
