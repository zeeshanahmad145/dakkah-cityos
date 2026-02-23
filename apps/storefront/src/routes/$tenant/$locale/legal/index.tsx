// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/legal/")({
  component: LegalServicesPage,
  head: () => ({
    meta: [
      { title: "Legal Services | Dakkah CityOS" },
      { name: "description", content: "Browse legal services on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/legal`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: [], count: 0 }
      const data = await resp.json()
      const raw = data.items || data.listings || data.products || data.services || []
      const items = raw.map((item: any) => {
        const meta = item.metadata || {}
        return {
          id: item.id,
          name: item.name || meta.name || "Attorney",
          bar_number: item.bar_number || meta.bar_number || null,
          specializations: item.specializations || meta.specializations || [],
          practice_areas: item.practice_areas || meta.practice_areas || [],
          bio: item.bio || meta.bio || "",
          education: item.education || meta.education || null,
          experience_years: item.experience_years || meta.experience_years || 0,
          currency_code: item.currency_code || meta.currency_code || "USD",
          thumbnail: meta.thumbnail || meta.images?.[0] || null,
          images: meta.images || [],
          rating: meta.rating || item.rating || null,
          hourly_rate: meta.hourly_rate || item.hourly_rate || null,
          location: item.location || meta.location || null,
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const specOptions = ["all", "corporate", "family", "criminal", "immigration", "real_estate", "intellectual_property"] as const

function LegalServicesPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [specFilter, setSpecFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.bio || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const specs = Array.isArray(item.specializations) ? item.specializations : (item.specializations ? [item.specializations] : [])
    const matchesSpec = specFilter === "all" || specs.some((s: string) => s === specFilter)
    return matchesSearch && matchesSpec
  })

  const formatRate = (rate: number | null, currency: string) => {
    if (!rate) return t(locale, 'verticals.contact_pricing')
    const amount = rate >= 100 ? rate / 100 : rate
    return `${amount.toLocaleString()} ${currency.toUpperCase()}/hr`
  }

  const formatSpec = (spec: string) => spec.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary to-ds-primary/80 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">{t(locale, 'legal.breadcrumb')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'legal.hero_title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, 'legal.hero_subtitle')}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} {t(locale, 'legal.attorneys_count')}</span>
            <span>|</span>
            <span>{t(locale, 'legal.badge_verified')}</span>
            <span>|</span>
            <span>{t(locale, 'legal.badge_consultation')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'legal.search_label')}</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(locale, 'legal.search_placeholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'legal.specialization_label')}</label>
                <div className="space-y-1">
                  {specOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSpecFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${specFilter === opt ? "bg-ds-primary text-ds-primary-foreground" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_specializations') : formatSpec(opt)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'verticals.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'legal.no_results_hint')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => {
                  const specs = Array.isArray(item.specializations) ? item.specializations : (item.specializations ? [item.specializations] : [])
                  return (
                    <a
                      key={item.id}
                      href={`${prefix}/legal/${item.id}`}
                      className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-muted-foreground transition-all duration-200 p-5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ds-muted to-ds-border overflow-hidden flex-shrink-0">
                          {item.thumbnail ? (
                            <img loading="lazy" src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-ds-muted-foreground text-xl font-bold">
                              {(item.name || "A").charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-ds-foreground group-hover:text-ds-muted-foreground transition-colors line-clamp-1">{item.name}</h3>
                          {item.bar_number && (
                            <p className="text-xs text-ds-muted-foreground">Bar #{item.bar_number}</p>
                          )}
                        </div>
                      </div>

                      {specs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {specs.slice(0, 3).map((s: string) => (
                            <span key={s} className="px-2 py-0.5 text-xs font-medium bg-ds-muted text-ds-foreground rounded-md">{formatSpec(s)}</span>
                          ))}
                          {specs.length > 3 && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-ds-muted text-ds-muted-foreground rounded-md">+{specs.length - 3}</span>
                          )}
                        </div>
                      )}

                      {item.bio && (
                        <p className="text-sm text-ds-muted-foreground mt-2 line-clamp-2">{item.bio}</p>
                      )}

                      <div className="flex items-center gap-3 mt-3 text-xs text-ds-muted-foreground">
                        {item.experience_years > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {item.experience_years}+ years
                          </span>
                        )}
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span className="truncate">{item.location}</span>
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
                          <span className="text-xs text-ds-muted-foreground">{item.rating}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                        <span className="font-bold text-ds-foreground text-lg">
                          {formatRate(item.hourly_rate, item.currency_code)}
                        </span>
                        <span className="px-3 py-1.5 text-xs font-semibold text-ds-primary-foreground bg-ds-primary rounded-lg group-hover:bg-ds-primary/80 transition-colors">{t(locale, 'legal.book_consultation')}</span>
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
              <div className="w-12 h-12 rounded-full bg-ds-primary text-ds-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'legal.step1_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'legal.step1_desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-ds-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'legal.step2_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'legal.step2_desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-ds-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'legal.step3_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'legal.step3_desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
