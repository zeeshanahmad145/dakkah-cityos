// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { t } from "@/lib/i18n"
import { useState } from "react"

export const Route = createFileRoute("/$tenant/$locale/marketplace/")({
  component: MarketplacePage,
  head: () => ({
    meta: [
      { title: "Marketplace | Dakkah CityOS" },
      { name: "description", content: "Browse product categories on our marketplace" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/vendors`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: [], count: 0 }
      const data = await resp.json()
      const raw = data.vendors || data.items || []
      const items = raw.map((v: any) => {
        const meta = v.metadata || {}
        return {
          id: v.id,
          handle: v.handle || v.slug || "",
          name: v.business_name || v.name || meta.business_name || "Unnamed Vendor",
          description: v.description || meta.description || "",
          logo_url: v.logo_url || v.logo || meta.logo_url || null,
          banner_url: v.banner_url || v.banner || meta.banner_url || null,
          is_verified: v.is_verified || meta.is_verified || false,
          total_products: v.total_products || meta.total_products || 0,
          rating: v.rating || meta.rating || null,
          categories: v.categories || meta.categories || [],
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const sortOptions = ["all", "popular", "newest", "trending"] as const
const priceOptions = ["all", "under_50", "50_to_200", "200_to_1000", "over_1000"] as const

function MarketplacePage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [sortFilter, setSortFilter] = useState<string>("popular")
  const [priceFilter, setPriceFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredCategories = items.filter((item: any) => {
    return searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
  })

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary to-ds-primary/90 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">Marketplace</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Marketplace</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Explore our curated selection of products across multiple categories from trusted vendors.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} vendors</span>
            <span>|</span>
            <span>{items.reduce((sum: number, item: any) => sum + (item.total_products || 0), 0).toLocaleString()} products</span>
            <span>|</span>
            <span>{t(locale, "marketplace.quality_assured", "Quality assured")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'marketplace.search_label', 'Search')}</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'marketplace.sort_label', 'Sort by')}</label>
                <div className="space-y-1">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSortFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${sortFilter === opt ? "bg-ds-primary text-ds-primary-foreground" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'marketplace.all_categories', 'All') : opt.charAt(0).toUpperCase() + opt.slice(1).replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'marketplace.price_label', 'Price Range')}</label>
                <div className="space-y-1">
                  {priceOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setPriceFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${priceFilter === opt ? "bg-ds-primary text-ds-primary-foreground" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'marketplace.all_prices', 'All Prices') : opt.replace('_', ' ').replace('under', 'Under $').replace('to', '-$').replace('over', 'Over $')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            {filteredCategories.length === 0 ? (
              <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
                <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">No categories found</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'marketplace.try_adjusting', 'Try adjusting your filters')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCategories.map((item: any) => (
                  <a
                    key={item.id}
                    href={`${prefix}/vendors/${item.handle || item.id}`}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-primary/40 transition-all duration-200"
                  >
                    <div className="aspect-[3/1] bg-gradient-to-br from-ds-primary/15 to-ds-primary/30 relative overflow-hidden">
                      {item.banner_url ? (
                        <img loading="lazy" src={item.banner_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-ds-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                      )}
                      {item.is_verified && (
                        <span className="absolute top-2 end-2 px-2 py-1 text-xs font-medium bg-ds-success text-white rounded-md flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Verified
                        </span>
                      )}
                    </div>

                    <div className="p-4 relative">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-ds-primary/15 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0 -mt-8">
                          {item.logo_url ? (
                            <img loading="lazy" src={item.logo_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-ds-primary">{(item.name || "V").charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <h3 className="text-lg font-semibold text-ds-foreground group-hover:text-ds-primary transition-colors line-clamp-1">{item.name}</h3>
                        </div>
                      </div>

                      {item.description && (
                        <p className="text-sm text-ds-muted-foreground mt-2 line-clamp-2">{item.description}</p>
                      )}

                      <div className="flex items-center gap-2 text-sm text-ds-muted-foreground mt-3 mb-4">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span>{(item.total_products || 0).toLocaleString()} products</span>
                      </div>

                      <div className="pt-3 border-t border-ds-border">
                        <span className="px-4 py-1.5 text-xs font-semibold text-white bg-ds-primary rounded-lg group-hover:bg-ds-primary/90 transition-colors inline-block">Visit Store</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <section className="py-16 bg-ds-card border-t border-ds-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">Why Shop Our Marketplace?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">🔍</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Wide Selection</h3>
              <p className="text-sm text-ds-muted-foreground">Shop from thousands of products across all major categories.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">✅</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Vetted Vendors</h3>
              <p className="text-sm text-ds-muted-foreground">All sellers are verified and quality-checked for your peace of mind.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">🛡️</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Secure Shopping</h3>
              <p className="text-sm text-ds-muted-foreground">Protected transactions and hassle-free returns on all purchases.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
