// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

const fallbackItems = [
  { id: "ti-1", name: "iPhone 15 Pro", category: "phones", thumbnail: "/seed-images/trade-in%2F1524758631624-e2822e304c36.jpg", description: "Trade in your iPhone 15 Pro for store credit. All storage sizes accepted.", condition_requirements: "Powers on, no cracks, iCloud unlocked", trade_in_min: 35000, trade_in_max: 65000 },
  { id: "ti-2", name: "MacBook Pro 14\"", category: "laptops", thumbnail: "/seed-images/trade-in%2F1542291026-7eec264c27ff.jpg", description: "Trade in your MacBook Pro for instant credit. M1, M2, and M3 models accepted.", condition_requirements: "Functional display, keyboard works, no water damage", trade_in_min: 45000, trade_in_max: 120000 },
  { id: "ti-3", name: "iPad Air / Pro", category: "tablets", thumbnail: "/seed-images/trade-in%2F1544244015-0df4b3ffc6b0.jpg", description: "Get credit for your used iPad. All generations and sizes welcome.", condition_requirements: "Screen intact, charges properly, factory reset", trade_in_min: 15000, trade_in_max: 55000 },
  { id: "ti-4", name: "PlayStation 5", category: "gaming", thumbnail: "/seed-images/trade-in%2F1593642532744-d377ab507dc8.jpg", description: "Trade your PS5 console for credit towards new gaming gear.", condition_requirements: "Disc drive works (if applicable), controller included", trade_in_min: 20000, trade_in_max: 35000 },
  { id: "ti-5", name: "Samsung Galaxy S24 Ultra", category: "phones", thumbnail: "/seed-images/trade-in%2F1606144042614-b2417e99c4e3.jpg", description: "Trade in your Galaxy S24 Ultra. Unlocked and carrier models accepted.", condition_requirements: "Screen works, no cracks, Google account removed", trade_in_min: 30000, trade_in_max: 55000 },
  { id: "ti-6", name: "AirPods Pro 2nd Gen", category: "electronics", thumbnail: "/seed-images/trade-in%2F1610945415295-d9bbf067e59c.jpg", description: "Trade in your AirPods Pro for credit. Case and earbuds required.", condition_requirements: "Both earbuds work, case charges, no water damage", trade_in_min: 5000, trade_in_max: 12000 },
]

export const Route = createFileRoute("/$tenant/$locale/trade-in/")({
  component: TradeInPage,
  head: () => ({
    meta: [
      { title: "Trade-In | Dakkah CityOS" },
      { name: "description", content: "Browse trade-in options on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/trade-in`, {
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

const categoryOptions = ["all", "electronics", "phones", "laptops", "tablets", "gaming"] as const

function TradeInPage() {
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
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-success to-ds-success text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">Trade-In Program</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'trade_in.title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, 'trade_in.subtitle')}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} eligible products</span>
            <span>|</span>
            <span>{t(locale, "tradeIn.badge_instant_credit", "Instant credit")}</span>
            <span>|</span>
            <span>{t(locale, "tradeIn.badge_free_shipping", "Free shipping")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'verticals.search_label')}</label>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t(locale, 'trade_in.search_placeholder')} className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring" />
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
                <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'trade_in.no_results')}</h3>
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
                        <div className="w-full h-full flex items-center justify-center"><svg className="w-16 h-16 text-ds-success/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg></div>
                      )}
                      <span className="absolute top-2 start-2 px-2 py-1 text-xs font-medium bg-ds-success text-white rounded-md capitalize">{item.category}</span>
                      {item.trade_in_max && (
                        <span className="absolute top-2 end-2 px-2 py-1 text-xs font-bold bg-ds-card/90 text-ds-success rounded-md">Up to {formatPrice(item.trade_in_max)}</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-ds-foreground group-hover:text-ds-success transition-colors line-clamp-1">{item.name}</h3>
                      {item.description && (<p className="text-sm text-ds-muted-foreground mt-1 line-clamp-2">{item.description}</p>)}

                      {item.condition_requirements && (
                        <div className="mt-3 p-2.5 bg-ds-success/10 rounded-lg">
                          <p className="text-xs font-medium text-ds-success mb-1">Condition Requirements:</p>
                          <p className="text-xs text-ds-success">{item.condition_requirements}</p>
                        </div>
                      )}

                      <div className="mt-3 space-y-1.5">
                        <p className="text-xs font-medium text-ds-foreground">Estimated trade-in value:</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-ds-success">{formatPrice(item.trade_in_min)} — {formatPrice(item.trade_in_max)}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                        <span className="text-xs text-ds-muted-foreground">Free shipping label</span>
                        <span className="px-4 py-1.5 text-xs font-semibold text-white bg-ds-success rounded-lg group-hover:bg-ds-success/90 transition-colors">{t(locale, 'trade_in.start_trade_in')}</span>
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
              <h3 className="font-semibold text-ds-foreground mb-2">Get an Estimate</h3>
              <p className="text-sm text-ds-muted-foreground">Select your device and answer a few questions about its condition.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Ship for Free</h3>
              <p className="text-sm text-ds-muted-foreground">We send you a prepaid shipping label. Pack and ship your device.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Get Paid</h3>
              <p className="text-sm text-ds-muted-foreground">Receive store credit or payment once we verify your device.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
