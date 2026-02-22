// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/$tenant/$locale/vendors/")({
  component: VendorsPage,
  head: () => ({
    meta: [
      { title: "Vendors | Dakkah CityOS" },
      { name: "description", content: "Browse vendors on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/vendors`, {
        headers: {
          "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_8284bf2e6620fac6cd844648a64e64ed0b4a0cf402d4dfc66725ffc67854d8a6",
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
          business_name: v.business_name || v.name || meta.business_name || "Unnamed Vendor",
          description: v.description || meta.description || "",
          logo_url: v.logo_url || v.logo || meta.logo_url || null,
          banner_url: v.banner_url || v.banner || meta.banner_url || null,
          is_verified: v.is_verified || meta.is_verified || false,
          total_products: v.total_products || meta.total_products || 0,
          total_orders: v.total_orders || meta.total_orders || 0,
          rating: v.rating || meta.rating || null,
          review_count: v.review_count || meta.review_count || 0,
          categories: v.categories || meta.categories || [],
          verticals: v.verticals || meta.verticals || [],
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const categoryOptions = ["all", "electronics", "fashion", "food", "health", "home", "sports", "beauty"] as const
const verifiedOptions = ["all", "verified", "unverified"] as const

function VendorsPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.business_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesCategory = categoryFilter === "all" ||
      (item.categories || []).some((c: string) => c.toLowerCase() === categoryFilter)
    const matchesVerified = verifiedFilter === "all" ||
      (verifiedFilter === "verified" ? item.is_verified : !item.is_verified)
    return matchesSearch && matchesCategory && matchesVerified
  })

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary to-ds-primary/90 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">Vendors</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Vendors</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Discover trusted sellers and explore their unique products and services.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} vendors</span>
            <span>|</span>
            <span>{t(locale, "vendors.badge_verified_sellers", "Verified sellers")}</span>
            <span>|</span>
            <span>{t(locale, "vendors.badge_quality_guaranteed", "Quality guaranteed")}</span>
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
                  placeholder="Search vendors..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'verticals.category_label')}</label>
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

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'verticals.status_label')}</label>
                <div className="space-y-1">
                  {verifiedOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setVerifiedFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${verifiedFilter === opt ? "bg-ds-primary text-ds-primary-foreground" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_vendors') : opt.charAt(0).toUpperCase() + opt.slice(1)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">No vendors found</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'verticals.try_adjusting')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => (
                  <a
                    key={item.id}
                    href={`${prefix}/vendors/${item.handle || item.id}`}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-primary/40 transition-all duration-200"
                  >
                    <div className="aspect-[3/1] bg-gradient-to-br from-ds-primary/15 to-ds-primary/30 relative overflow-hidden">
                      {item.banner_url ? (
                        <img loading="lazy" src={item.banner_url} alt={item.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
                            <img loading="lazy" src={item.logo_url} alt={item.business_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-ds-primary">{(item.business_name || "V").charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <h3 className="font-semibold text-ds-foreground group-hover:text-ds-primary transition-colors line-clamp-1">{item.business_name}</h3>
                        </div>
                      </div>

                      {item.description && (
                        <p className="text-sm text-ds-muted-foreground mt-2 line-clamp-2">{item.description}</p>
                      )}

                      <div className="flex items-center gap-3 mt-3 text-xs text-ds-muted-foreground">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                          {item.total_products} products
                        </span>
                        {item.total_orders > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            {item.total_orders} orders
                          </span>
                        )}
                      </div>

                      {item.rating && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg key={star} className={`w-3.5 h-3.5 ${star <= Math.round(item.rating) ? "text-ds-warning" : "text-ds-border"}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs text-ds-muted-foreground">{item.rating} ({item.review_count})</span>
                        </div>
                      )}

                      {item.categories && item.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {item.categories.slice(0, 3).map((cat: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 text-xs bg-ds-primary/10 text-ds-primary rounded-full capitalize">{cat}</span>
                          ))}
                        </div>
                      )}

                      <div className="pt-3 mt-3 border-t border-ds-border">
                        <span className="px-4 py-1.5 text-xs font-semibold text-white bg-ds-primary rounded-lg group-hover:bg-ds-primary/90 transition-colors">Visit Store</span>
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
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">Why Shop With Our Vendors?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">✓</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Verified Sellers</h3>
              <p className="text-sm text-ds-muted-foreground">Every vendor is vetted for quality and reliability.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">🛡️</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Buyer Protection</h3>
              <p className="text-sm text-ds-muted-foreground">Shop with confidence with our buyer protection guarantee.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">⭐</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Real Reviews</h3>
              <p className="text-sm text-ds-muted-foreground">Transparent ratings and reviews from real customers.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
