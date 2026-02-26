// @ts-nocheck
import { t } from "@/lib/i18n"
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/$tenant/$locale/subscriptions/")({
  component: SubscriptionsPage,
  head: () => ({
    meta: [
      { title: "Subscriptions | Dakkah CityOS" },
      { name: "description", content: "Browse subscription plans on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/subscriptions`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: [], count: 0 }
      const data = await resp.json()
      const raw = data.subscriptions || data.plans || data.items || []
      const items = raw.map((s: any) => {
        const meta = s.metadata || {}
        return {
          id: s.id,
          name: meta.name || s.name || s.plan_name || s.title || "Untitled Plan",
          description: meta.description || s.description || "",
          price: meta.price || s.price || s.amount || null,
          currency: meta.currency || s.currency || "USD",
          billing_interval: meta.billing_interval || s.billing_interval || s.interval || "monthly",
          features: meta.features || s.features || [],
          thumbnail: s.thumbnail || meta.thumbnail || meta.image || s.thumbnail || null,
          is_popular: meta.is_popular || s.is_popular || false,
          trial_days: meta.trial_days || s.trial_days || 0,
          status: s.status || "active",
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const intervalOptions = ["all", "monthly", "quarterly", "yearly"] as const

function SubscriptionsPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [intervalFilter, setIntervalFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesInterval = intervalFilter === "all" || item.billing_interval === intervalFilter
    return matchesSearch && matchesInterval
  })

  const formatPrice = (price: number | null, currency: string, interval: string) => {
    if (!price) return "Free"
    const amount = price >= 100 ? price / 100 : price
    return `${amount.toLocaleString()} ${currency}`
  }

  const intervalLabel = (interval: string) => {
    switch (interval) {
      case "monthly": return "/mo"
      case "quarterly": return "/quarter"
      case "yearly": return "/year"
      default: return `/${interval}`
    }
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary to-ds-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">Subscriptions</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'subscriptions.title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Choose the perfect subscription plan for your needs. Flexible billing, cancel anytime.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} plans available</span>
            <span>|</span>
            <span>{t(locale, "subscriptions.badge_free_trial", "Free trial included")}</span>
            <span>|</span>
            <span>{t(locale, "subscriptions.badge_cancel_anytime", "Cancel anytime")}</span>
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
                  placeholder={t(locale, 'subscriptions.search_placeholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">Billing Interval</label>
                <div className="space-y-1">
                  {intervalOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setIntervalFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${intervalFilter === opt ? "bg-ds-primary text-ds-primary-foreground" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_intervals') : opt.charAt(0).toUpperCase() + opt.slice(1)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'subscriptions.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'verticals.try_adjusting')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => (
                  <div
                    key={item.id}
                    className={`group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-primary/40 transition-all duration-200 ${item.is_popular ? "ring-2 ring-ds-primary" : ""}`}
                  >
                    <div className="bg-gradient-to-br from-ds-primary to-ds-primary p-6 text-white text-center relative">
                      {item.is_popular && (
                        <span className="absolute top-2 end-2 px-2 py-1 text-xs font-bold bg-ds-card text-ds-primary rounded-full">Popular</span>
                      )}
                      <div className="text-3xl mb-2">
                        <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </div>
                      <h3 className="text-xl font-bold">{item.name}</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-extrabold">{formatPrice(item.price, item.currency, item.billing_interval)}</span>
                        <span className="text-sm text-white/70">{intervalLabel(item.billing_interval)}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      {item.description && (
                        <p className="text-sm text-ds-muted-foreground mb-4 line-clamp-2">{item.description}</p>
                      )}

                      {item.trial_days > 0 && (
                        <div className="flex items-center gap-2 mb-3 text-xs text-ds-primary bg-ds-primary/10 px-3 py-1.5 rounded-lg">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {item.trial_days}-day free trial
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-3 px-3 py-1.5 text-xs bg-ds-muted rounded-lg text-ds-muted-foreground capitalize">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Billed {item.billing_interval}
                      </div>

                      {item.features && item.features.length > 0 && (
                        <ul className="space-y-2 mb-4">
                          {item.features.slice(0, 6).map((f: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-ds-foreground">
                              <svg className="w-4 h-4 text-ds-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}

                      <button className="w-full py-2.5 text-sm font-semibold text-white bg-ds-primary rounded-lg hover:bg-ds-primary/90 transition-colors">
                        {t(locale, 'subscriptions.subscribe_now')}
                      </button>
                    </div>
                  </div>
                ))}
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
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Choose a Plan</h3>
              <p className="text-sm text-ds-muted-foreground">Select the subscription that fits your needs and budget.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Start Your Trial</h3>
              <p className="text-sm text-ds-muted-foreground">Enjoy a free trial period to explore all the features.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Stay Flexible</h3>
              <p className="text-sm text-ds-muted-foreground">Upgrade, downgrade, or cancel anytime from your dashboard.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
