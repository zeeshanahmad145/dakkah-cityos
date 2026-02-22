// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/insurance/")({
  component: InsurancePage,
  head: () => ({
    meta: [
      { title: "Insurance | Dakkah CityOS" },
      { name: "description", content: "Browse insurance products on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/insurance`, {
        headers: {
          "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_8284bf2e6620fac6cd844648a64e64ed0b4a0cf402d4dfc66725ffc67854d8a6",
        },
      })
      if (!resp.ok) return { items: [], count: 0 }
      const data = await resp.json()
      const raw = data.items || data.listings || data.products || data.services || []
      const items = raw.map((item: any) => {
        const meta = item.metadata || {}
        return {
          id: item.id,
          name: item.name || meta.name || "Insurance Plan",
          description: item.description || meta.description || "",
          insurance_type: item.insurance_type || meta.insurance_type || null,
          coverage_details: item.coverage_details || meta.coverage_details || null,
          currency_code: item.currency_code || meta.currency_code || "USD",
          thumbnail: meta.thumbnail || meta.images?.[0] || null,
          images: meta.images || [],
          price: meta.price || item.price || null,
          rating: meta.rating || item.rating || null,
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const typeOptions = ["all", "health", "auto", "home", "life", "travel", "business"] as const

function InsurancePage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesType = typeFilter === "all" || item.insurance_type === typeFilter
    return matchesSearch && matchesType
  })

  const typeIcon = (type: string) => {
    const map: Record<string, string> = { health: "🏥", auto: "🚗", home: "🏠", life: "❤️", travel: "✈️", business: "🏢" }
    return map[type] || "🛡️"
  }

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return t(locale, 'insurance.get_quote')
    const amount = price >= 100 ? price / 100 : price
    return `${amount.toLocaleString()} ${currency.toUpperCase()}`
  }

  const getCoverageHighlights = (details: any) => {
    if (!details) return []
    if (typeof details === "string") {
      try { details = JSON.parse(details) } catch { return [details] }
    }
    if (Array.isArray(details)) return details.slice(0, 3)
    if (typeof details === "object") return Object.entries(details).slice(0, 3).map(([k, v]) => `${k}: ${v}`)
    return []
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-info to-ds-success/90 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">Insurance</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'insurance.title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Protect what matters most with comprehensive coverage options tailored to your needs.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} plans available</span>
            <span>|</span>
            <span>{t(locale, 'verticals.verified_providers')}</span>
            <span>|</span>
            <span>{t(locale, 'verticals.instant_booking')}</span>
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
                  placeholder={t(locale, 'insurance.search_placeholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-info"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">Insurance Type</label>
                <div className="space-y-1">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setTypeFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${typeFilter === opt ? "bg-ds-info text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_types') : `${typeIcon(opt)} ${opt.charAt(0).toUpperCase() + opt.slice(1)}`}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'insurance.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'verticals.try_adjusting')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => {
                  const highlights = getCoverageHighlights(item.coverage_details)
                  return (
                    <a
                      key={item.id}
                      href={`${prefix}/insurance/${item.id}`}
                      className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-info/40 transition-all duration-200"
                    >
                      <div className="aspect-[16/9] bg-gradient-to-br from-ds-info/10 to-ds-success/15 relative overflow-hidden">
                        {item.thumbnail ? (
                          <img loading="lazy" src={item.thumbnail} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-5xl">{typeIcon(item.insurance_type || "")}</span>
                          </div>
                        )}
                        {item.insurance_type && (
                          <span className="absolute top-2 start-2 px-2 py-1 text-xs font-medium bg-ds-info text-white rounded-md capitalize">
                            {typeIcon(item.insurance_type)} {item.insurance_type}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-ds-foreground group-hover:text-ds-info transition-colors line-clamp-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-ds-muted-foreground mt-1.5 line-clamp-2">{item.description}</p>
                        )}

                        {highlights.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {highlights.map((h: string, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-ds-muted-foreground">
                                <svg className="w-3.5 h-3.5 text-ds-info flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="line-clamp-1">{h}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {item.rating && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} className={`w-3.5 h-3.5 ${star <= Math.round(item.rating) ? "text-ds-warning" : "text-ds-border"}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-xs text-ds-muted-foreground">{item.rating}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                          <span className="font-bold text-ds-info text-lg">
                            {formatPrice(item.price, item.currency_code)}
                          </span>
                          <span className="px-3 py-1.5 text-xs font-semibold text-white bg-ds-info rounded-lg group-hover:bg-ds-info/90 transition-colors">{t(locale, 'insurance.get_quote')}</span>
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
              <div className="w-12 h-12 rounded-full bg-ds-info text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Compare Plans</h3>
              <p className="text-sm text-ds-muted-foreground">Browse coverage options and compare plans side by side.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-info text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Get a Quote</h3>
              <p className="text-sm text-ds-muted-foreground">Receive personalized quotes based on your coverage needs.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-info text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Get Covered</h3>
              <p className="text-sm text-ds-muted-foreground">Enroll in your chosen plan and enjoy peace of mind.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
