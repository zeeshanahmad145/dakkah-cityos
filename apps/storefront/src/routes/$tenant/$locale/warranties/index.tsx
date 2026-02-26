// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/warranties/")({
  component: WarrantiesPage,
  head: () => ({
    meta: [
      { title: "Warranties | Dakkah CityOS" },
      { name: "description", content: "Browse warranty options on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/warranties`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: [], count: 0 }
      const data = await resp.json()
      const raw = data.items || data.listings || data.products || data.services || data.warranties || data.plans || []
      const items = raw.map((item: any) => {
        const meta = item.metadata || {}
        return {
          id: item.id,
          name: item.name || meta.name || "Warranty Plan",
          description: item.description || meta.description || "",
          plan_type: item.plan_type || meta.plan_type || null,
          duration_months: item.duration_months || meta.duration_months || null,
          currency_code: item.currency_code || meta.currency_code || "USD",
          coverage: (() => { const c = item.coverage || meta.coverage; if (!c) return null; if (typeof c === 'string') return [c]; if (Array.isArray(c)) return c.map((x: any) => typeof x === 'string' ? x : String(x)); return Object.keys(c).filter((k: string) => c[k]); })(),
          exclusions: (() => { const e = item.exclusions || meta.exclusions; if (!e) return null; if (typeof e === 'string') return [e]; if (Array.isArray(e)) return e.map((x: any) => typeof x === 'string' ? x : String(x)); return Object.keys(e).filter((k: string) => e[k]); })(),
          is_active: item.is_active !== false,
          thumbnail: item.thumbnail || meta.thumbnail || meta.images?.[0] || null,
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

const planTypeOptions = ["all", "basic", "standard", "premium", "extended"] as const

const planTypeColors: Record<string, { badge: string; accent: string }> = {
  basic: { badge: "bg-ds-muted text-ds-foreground/80", accent: "text-ds-muted-foreground" },
  standard: { badge: "bg-ds-info/15 text-ds-info", accent: "text-ds-primary" },
  premium: { badge: "bg-ds-warning/15 text-ds-warning", accent: "text-ds-warning" },
  extended: { badge: "bg-ds-success/15 text-ds-success", accent: "text-ds-success" },
}

function WarrantiesPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []
  const [searchQuery, setSearchQuery] = useState("")
  const [planTypeFilter, setPlanTypeFilter] = useState<string>("all")

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesPlanType = planTypeFilter === "all" || item.plan_type?.toLowerCase() === planTypeFilter
    return matchesSearch && matchesPlanType
  })

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return t(locale, 'verticals.contact_pricing')
    const amount = price >= 100 ? price / 100 : price
    return `${amount.toLocaleString()} ${currency}`
  }

  const formatDuration = (months: number | null) => {
    if (!months) return null
    if (months >= 12) {
      const years = months / 12
      return years === 1 ? "1 Year" : `${years} Years`
    }
    return months === 1 ? "1 Month" : `${months} Months`
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-success to-ds-success text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">Warranties</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'warranty.title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, 'warranty.subtitle')}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} plans available</span>
            <span>|</span>
            <span>{t(locale, "warranties.badge_full_coverage", "Full coverage")}</span>
            <span>|</span>
            <span>{t(locale, "warranties.badge_easy_claims", "Easy claims")}</span>
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
                  placeholder={t(locale, 'warranty.search_placeholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-success"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">Plan Type</label>
                <div className="space-y-1">
                  {planTypeOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setPlanTypeFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${planTypeFilter === opt ? "bg-ds-success text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_plans') : opt.charAt(0).toUpperCase() + opt.slice(1)}
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
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'warranty.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'verticals.try_adjusting')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => (
                  <a
                    key={item.id}
                    href={`${prefix}/warranties/${item.id}`}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-success/40 transition-all duration-200"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-ds-success/10 to-ds-success/15 relative overflow-hidden">
                      {item.thumbnail ? (
                        <img loading="lazy" src={item.thumbnail} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-16 h-16 text-ds-success/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                      )}
                      {item.plan_type && (
                        <span className={`absolute top-2 start-2 px-2.5 py-1 text-xs font-semibold rounded-md capitalize ${planTypeColors[item.plan_type?.toLowerCase()]?.badge || "bg-ds-muted text-ds-foreground/80"}`}>
                          {item.plan_type}
                        </span>
                      )}
                      {formatDuration(item.duration_months) && (
                        <span className="absolute top-2 end-2 px-2 py-1 text-xs font-medium bg-ds-card/90 text-ds-foreground/80 rounded-md">
                          {formatDuration(item.duration_months)}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-ds-foreground group-hover:text-ds-success transition-colors line-clamp-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-ds-muted-foreground mt-1.5 line-clamp-2">{item.description}</p>
                      )}

                      {item.coverage && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-ds-foreground mb-1">Coverage Highlights:</p>
                          <ul className="text-xs text-ds-muted-foreground space-y-1">
                            {(Array.isArray(item.coverage) ? item.coverage.slice(0, 3) : [item.coverage]).map((c: string, i: number) => (
                              <li key={i} className="flex items-center gap-1">
                                <svg className="w-3 h-3 text-ds-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span className="line-clamp-1">{c}</span>
                              </li>
                            ))}
                          </ul>
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
                        <span className="font-bold text-ds-success text-lg">
                          {formatPrice(item.price, item.currency_code)}
                        </span>
                        <span className="px-3 py-1.5 text-xs font-semibold text-white bg-ds-success rounded-lg group-hover:bg-ds-success/90 transition-colors">{t(locale, 'warranty.get_protection')}</span>
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
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">{t(locale, 'warranty.why_choose')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Comprehensive Coverage</h3>
              <p className="text-sm text-ds-muted-foreground">Choose from plans that cover mechanical failures, accidental damage, and more.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Easy Claims Process</h3>
              <p className="text-sm text-ds-muted-foreground">File a claim online in minutes and get fast resolution from our team.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Peace of Mind</h3>
              <p className="text-sm text-ds-muted-foreground">Rest easy knowing your valuable purchases are protected long-term.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
