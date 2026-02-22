// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

function getFallbackItems() {
  const now = Date.now()
  return [
    { id: "fd-1", name: "Wireless Noise-Cancelling Headphones", category: "electronics", thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80", original_price: 29999, sale_price: 14999, discount_percentage: 50, end_date: new Date(now + 3 * 60 * 60 * 1000).toISOString(), stock_remaining: 12, description: "Premium ANC headphones with 30hr battery life" },
    { id: "fd-2", name: "Smart Fitness Watch Pro", category: "electronics", thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80", original_price: 19999, sale_price: 9999, discount_percentage: 50, end_date: new Date(now + 5 * 60 * 60 * 1000).toISOString(), stock_remaining: 8, description: "Heart rate, GPS, and sleep tracking" },
    { id: "fd-3", name: "Designer Leather Handbag", category: "fashion", thumbnail: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80", original_price: 24999, sale_price: 12499, discount_percentage: 50, end_date: new Date(now + 2 * 60 * 60 * 1000).toISOString(), stock_remaining: 5, description: "Italian genuine leather, limited edition" },
    { id: "fd-4", name: "Organic Skincare Bundle", category: "beauty", thumbnail: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80", original_price: 8999, sale_price: 3599, discount_percentage: 60, end_date: new Date(now + 8 * 60 * 60 * 1000).toISOString(), stock_remaining: 23, description: "5-piece set with cleanser, toner, serum, moisturizer & mask" },
    { id: "fd-5", name: "Premium Coffee Machine", category: "home", thumbnail: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80", original_price: 44999, sale_price: 22499, discount_percentage: 50, end_date: new Date(now + 1 * 60 * 60 * 1000).toISOString(), stock_remaining: 3, description: "Espresso, cappuccino & latte with built-in grinder" },
    { id: "fd-6", name: "Running Shoes Ultra Boost", category: "sports", thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80", original_price: 17999, sale_price: 8999, discount_percentage: 50, end_date: new Date(now + 6 * 60 * 60 * 1000).toISOString(), stock_remaining: 15, description: "Lightweight with responsive cushioning" },
    { id: "fd-7", name: "4K Ultra HD Smart TV 55\"", category: "electronics", thumbnail: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&q=80", original_price: 79999, sale_price: 47999, discount_percentage: 40, end_date: new Date(now + 4 * 60 * 60 * 1000).toISOString(), stock_remaining: 7, description: "HDR10+, Dolby Vision, built-in streaming" },
    { id: "fd-8", name: "Luxury Perfume Gift Set", category: "beauty", thumbnail: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80", original_price: 15999, sale_price: 7999, discount_percentage: 50, end_date: new Date(now + 10 * 60 * 60 * 1000).toISOString(), stock_remaining: 18, description: "3 signature fragrances in premium packaging" },
  ]
}

export const Route = createFileRoute("/$tenant/$locale/flash-deals/")({
  component: FlashDealsPage,
  head: () => ({
    meta: [
      { title: "Flash Deals | Dakkah CityOS" },
      { name: "description", content: "Browse flash deals on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/flash-sales`, {
        headers: {
          "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_8284bf2e6620fac6cd844648a64e64ed0b4a0cf402d4dfc66725ffc67854d8a6",
        },
      })
      if (!resp.ok) { const fb = getFallbackItems(); return { items: fb, count: fb.length } }
      const data = await resp.json()
      const raw = data.items || data.listings || data.products || []
      if (raw.length > 0) return { items: raw, count: data.count || raw.length }
      const fb = getFallbackItems()
      return { items: fb, count: fb.length }
    } catch {
      const fb = getFallbackItems()
      return { items: fb, count: fb.length }
    }
  },
})

const categoryOptions = ["all", "electronics", "fashion", "home", "beauty", "sports"] as const

function FlashDealsPage() {
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

  function getTimeRemaining(endDate: string) {
    const diff = new Date(endDate).getTime() - Date.now()
    if (diff <= 0) return "Ended"
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
    return `${hours}h ${minutes}m ${seconds}s`
  }

  const formatPrice = (price: number) => {
    const amount = price >= 100 ? price / 100 : price
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-destructive to-ds-warning text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">{t(locale, 'flash_deals.breadcrumb')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'flash_deals.hero_title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, 'flash_deals.hero_subtitle')}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} {t(locale, 'flash_deals.deals_available')}</span>
            <span>|</span>
            <span>{t(locale, 'flash_deals.badge_discount')}</span>
            <span>|</span>
            <span>{t(locale, 'flash_deals.badge_limited_stock')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'flash_deals.search_label')}</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(locale, 'flash_deals.search_placeholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'flash_deals.category_label')}</label>
                <div className="space-y-1">
                  {categoryOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setCategoryFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${categoryFilter === opt ? "bg-ds-destructive text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'verticals.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'flash_deals.no_results_hint')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => {
                  const discount = item.discount_percentage || 0
                  const originalPrice = item.original_price || 0
                  const salePrice = item.sale_price || 0
                  const timeLeft = item.end_date ? getTimeRemaining(item.end_date) : null
                  const stockRemaining = item.stock_remaining || 0
                  return (
                    <div
                      key={item.id}
                      className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-destructive/40 transition-all duration-200"
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-ds-destructive/10 to-ds-warning/10 relative overflow-hidden">
                        {item.thumbnail ? (
                          <img loading="lazy" src={item.thumbnail} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-ds-destructive/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                        )}
                        {discount > 0 && (
                          <span className="absolute top-2 start-2 px-2.5 py-1 text-xs font-bold bg-ds-destructive text-white rounded-md">SALE -{discount}%</span>
                        )}
                        {timeLeft && (
                          <span className="absolute top-2 end-2 px-2 py-1 text-xs font-medium bg-black/70 text-white rounded-md flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {timeLeft}
                          </span>
                        )}
                        {stockRemaining > 0 && stockRemaining <= 10 && (
                          <span className="absolute bottom-2 start-2 px-2 py-1 text-xs font-medium bg-ds-warning text-white rounded-md">Only {stockRemaining} left!</span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-ds-foreground group-hover:text-ds-destructive transition-colors line-clamp-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-ds-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                        )}
                        {item.category && (
                          <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-ds-destructive/10 text-ds-destructive rounded capitalize">{item.category}</span>
                        )}

                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xl font-bold text-ds-destructive">{formatPrice(salePrice)}</span>
                          {originalPrice > salePrice && (
                            <span className="text-sm text-ds-muted-foreground line-through">{formatPrice(originalPrice)}</span>
                          )}
                        </div>

                        {stockRemaining > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-ds-muted-foreground mb-1">
                              <span>{stockRemaining} remaining</span>
                              <span>{Math.min(Math.round((1 - stockRemaining / 30) * 100), 95)}% claimed</span>
                            </div>
                            <div className="w-full bg-ds-border rounded-full h-2">
                              <div className="bg-gradient-to-r from-ds-destructive to-ds-warning h-2 rounded-full" style={{ width: `${Math.min(Math.round((1 - stockRemaining / 30) * 100), 95)}%` }} />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                          <span className="text-xs text-ds-success font-medium">Save {formatPrice(originalPrice - salePrice)}</span>
                          <span className="px-4 py-1.5 text-xs font-semibold text-white bg-ds-destructive rounded-lg group-hover:bg-ds-destructive/90 transition-colors">{t(locale, 'flash_deals.grab_deal')}</span>
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
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">{t(locale, 'flash_deals.how_it_works_title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-destructive text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'flash_deals.step1_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'flash_deals.step1_desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-destructive text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'flash_deals.step2_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'flash_deals.step2_desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-destructive text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'flash_deals.step3_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'flash_deals.step3_desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
