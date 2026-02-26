// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

const fallbackItems = [
  { id: "tby-1", name: "Premium Noise-Cancelling Headphones", category: "electronics", thumbnail: "/seed-images/try-before-you-buy%2F1504148455328-c376907d081c.jpg", description: "Experience world-class ANC with 30hr battery. Try them for 14 days risk-free.", trial_period: 14, deposit: 4999 },
  { id: "tby-2", name: "Ergonomic Office Chair", category: "furniture", thumbnail: "/seed-images/try-before-you-buy%2F1504280390367-361c6d9f38f4.jpg", description: "Adjustable lumbar support, breathable mesh, and armrests. Perfect for home office.", trial_period: 30, deposit: 9999 },
  { id: "tby-3", name: "Smart Fitness Tracker", category: "electronics", thumbnail: "/seed-images/try-before-you-buy%2F1516035069371-29a1b244cc32.jpg", description: "Track steps, heart rate, sleep, and workouts. Water-resistant to 50m.", trial_period: 14, deposit: 2499 },
  { id: "tby-4", name: "Designer Sunglasses", category: "fashion", thumbnail: "/seed-images/try-before-you-buy%2F1504148455328-c376907d081c.jpg", description: "Polarized lenses, UV400 protection. Italian acetate frames.", trial_period: 7, deposit: 3499 },
  { id: "tby-5", name: "Professional Espresso Machine", category: "home", thumbnail: "/seed-images/try-before-you-buy%2F1504280390367-361c6d9f38f4.jpg", description: "Dual boiler system with PID temperature control. Barista-grade at home.", trial_period: 30, deposit: 14999 },
  { id: "tby-6", name: "Luxury Skincare Set", category: "beauty", thumbnail: "/seed-images/try-before-you-buy%2F1516035069371-29a1b244cc32.jpg", description: "5-piece premium skincare routine with cleanser, serum, moisturizer, eye cream & mask.", trial_period: 14, deposit: 4999 },
]

export const Route = createFileRoute("/$tenant/$locale/try-before-you-buy/")({
  component: TryBeforeYouBuyPage,
  head: () => ({
    meta: [
      { title: "Try Before You Buy | Dakkah CityOS" },
      { name: "description", content: "Try products before you buy on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/try-before-you-buy`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: fallbackItems, count: fallbackItems.length }
      const data = await resp.json()
      const raw = data.items || data.listings || data.products || []
      return { items: raw.length > 0 ? raw : fallbackItems, count: raw.length > 0 ? (data.count || raw.length) : fallbackItems.length }
    } catch {
      return { items: fallbackItems, count: fallbackItems.length }
    }
  },
})

const categoryOptions = ["all", "electronics", "fashion", "beauty", "furniture", "home", "fitness"] as const

function TryBeforeYouBuyPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const formatPrice = (price: number) => {
    if (price == null) return "$0.00"
    const amount = price >= 100 ? price / 100 : price
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-success to-ds-success text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">Try Before You Buy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'try_before_you_buy.title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, 'try_before_you_buy.subtitle')}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} products available</span>
            <span>|</span>
            <span>{t(locale, "tryBeforeYouBuy.badge_risk_free", "Risk-free trials")}</span>
            <span>|</span>
            <span>{t(locale, "tryBeforeYouBuy.badge_free_returns", "Free returns")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'verticals.search_label')}</label>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t(locale, 'try_before_you_buy.search_placeholder')} className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'verticals.category_label')}</label>
                <div className="space-y-1">
                  {categoryOptions.map((opt) => (
                    <button key={opt} onClick={() => setCategoryFilter(opt)} className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${categoryFilter === opt ? "bg-ds-success text-white" : "text-ds-foreground hover:bg-ds-muted"}`}>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'try_before_you_buy.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'verticals.try_adjusting')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => (
                  <div key={item.id} className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-success/40 transition-all duration-200">
                    <div className="aspect-[4/3] bg-gradient-to-br from-ds-success/10 to-ds-success/10 relative overflow-hidden">
                      {item.thumbnail ? (
                        <img loading="lazy" src={item.thumbnail} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><svg className="w-16 h-16 text-ds-success/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5" /></svg></div>
                      )}
                      <span className="absolute top-2 start-2 px-2.5 py-1 text-xs font-bold bg-ds-success text-white rounded-md">Try Free</span>
                      {item.trial_period && (
                        <span className="absolute top-2 end-2 px-2 py-1 text-xs font-medium bg-black/70 text-white rounded-md">{item.trial_period}-day trial</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-ds-foreground group-hover:text-ds-success transition-colors line-clamp-1">{item.name}</h3>
                      {item.description && (<p className="text-sm text-ds-muted-foreground mt-1 line-clamp-2">{item.description}</p>)}

                      {item.category && (
                        <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-ds-success/10 text-ds-success rounded capitalize">{item.category}</span>
                      )}

                      <div className="space-y-2 mt-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-ds-muted-foreground">Trial Period</span>
                          <span className="font-semibold text-ds-foreground">{item.trial_period} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ds-muted-foreground">Refundable Deposit</span>
                          <span className="font-bold text-ds-success">{formatPrice(item.deposit)}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                        <span className="text-xs text-ds-muted-foreground">Free returns</span>
                        <span className="px-4 py-1.5 text-xs font-semibold text-white bg-ds-success rounded-lg group-hover:bg-ds-success/90 transition-colors">{t(locale, 'try_before_you_buy.try_now')}</span>
                      </div>
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
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Choose a Product</h3>
              <p className="text-sm text-ds-muted-foreground">Select a product and start your free trial with a refundable deposit.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Try at Home</h3>
              <p className="text-sm text-ds-muted-foreground">Use the product during the trial period. No commitment.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Keep or Return</h3>
              <p className="text-sm text-ds-muted-foreground">Love it? Keep it. Not for you? Return it for free and get your deposit back.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
