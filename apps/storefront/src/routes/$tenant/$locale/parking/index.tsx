// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/parking/")({
  component: ParkingPage,
  head: () => ({
    meta: [
      { title: "Parking | Dakkah CityOS" },
      { name: "description", content: "Browse parking options on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/parking`, {
        headers: {
          "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_b52dbbf895687445775c819d8cd5cb935f27231ef3a32ade606b58d9e5798d3a",
        },
      })
      if (!resp.ok) return { items: [], count: 0 }
      const data = await resp.json()
      const raw = data.items || data.listings || data.products || []
      const items = raw.map((s: any) => {
        const meta = s.metadata || {}
        return {
          id: s.id,
          name: s.name || meta.name || "Parking Facility",
          description: s.description || meta.description || "",
          thumbnail: meta.thumbnail || meta.images?.[0] || null,
          images: meta.images || [],
          price_per_hour: meta.price_per_hour || null,
          currency: s.currency_code || meta.currency || "SAR",
          zone_type: s.zone_type || null,
          address: typeof (s.address || meta.address) === 'string' ? (s.address || meta.address) : (s.address || meta.address) ? [s.address?.line1 || meta.address?.line1, s.address?.city || meta.address?.city, s.address?.country || meta.address?.country].filter(Boolean).join(', ') : null,
          total_spots: s.total_spots || null,
          available_spots: s.available_spots || null,
          operating_hours: typeof (s.operating_hours || meta.operating_hours) === 'string' ? (s.operating_hours || meta.operating_hours) : (s.operating_hours || meta.operating_hours) ? JSON.stringify(s.operating_hours || meta.operating_hours).replace(/[{}"]/g, '').replace(/,/g, ', ') : null,
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const zoneTypeOptions = ["all", "covered", "open", "underground", "multi_story", "valet"] as const

function ParkingPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [zoneTypeFilter, setZoneTypeFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.address || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesZone = zoneTypeFilter === "all" || item.zone_type === zoneTypeFilter
    return matchesSearch && matchesZone
  })

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return t(locale, 'verticals.contact_pricing')
    const amount = price >= 100 ? price / 100 : price
    return `${amount.toLocaleString()} ${currency}/hr`
  }

  const zoneLabel = (z: string) => {
    const map: Record<string, string> = { covered: "Covered", open: "Open Air", underground: "Underground", multi_story: "Multi-Story", valet: "Valet" }
    return map[z] || z.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
  }

  const zoneIcon = (z: string | null) => {
    if (z === "covered") return "🏗️"
    if (z === "underground") return "🅿️"
    if (z === "multi_story") return "🏢"
    if (z === "valet") return "🔑"
    return "🅿️"
  }

  const availabilityColor = (available: number | null, total: number | null) => {
    if (available == null) return "text-ds-muted-foreground"
    if (available === 0) return "text-ds-destructive"
    if (total && available / total < 0.2) return "text-ds-warning"
    return "text-ds-success"
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary to-ds-primary/90 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">{t(locale, 'parking.breadcrumb')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'parking.hero_title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, 'parking.hero_subtitle')}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} {t(locale, 'parking.facilities_count')}</span>
            <span>|</span>
            <span>{t(locale, 'parking.badge_instant')}</span>
            <span>|</span>
            <span>{t(locale, 'parking.badge_24_7')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'parking.search_label')}</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(locale, 'parking.search_placeholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'parking.zone_type_label')}</label>
                <div className="space-y-1">
                  {zoneTypeOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setZoneTypeFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${zoneTypeFilter === opt ? "bg-ds-primary text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_zone_types') : zoneLabel(opt)}
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
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'verticals.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'parking.no_results_hint')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => (
                  <a
                    key={item.id}
                    href={`${prefix}/parking/${item.id}`}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-primary/40 transition-all duration-200"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-ds-primary/10 to-ds-primary/15 relative overflow-hidden">
                      {item.thumbnail ? (
                        <img loading="lazy" src={item.thumbnail} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-16 h-16 text-ds-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}
                      {item.zone_type && (
                        <span className="absolute top-2 start-2 px-2 py-1 text-xs font-medium bg-ds-primary text-white rounded-md">{zoneIcon(item.zone_type)} {zoneLabel(item.zone_type)}</span>
                      )}
                      {item.images && item.images.length > 1 && (
                        <div className="absolute bottom-2 end-2 px-2 py-0.5 text-xs font-medium bg-black/50 text-white rounded-md flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {item.images.length}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-ds-foreground group-hover:text-ds-primary transition-colors line-clamp-1">{item.name}</h3>

                      {item.address && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-ds-muted-foreground">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <span className="truncate">{item.address}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-3 text-xs text-ds-muted-foreground">
                        {item.available_spots != null && (
                          <span className={`flex items-center gap-1 font-medium ${availabilityColor(item.available_spots, item.total_spots)}`}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {item.available_spots === 0 ? "Full" : `${item.available_spots}${item.total_spots ? `/${item.total_spots}` : ""} spots`}
                          </span>
                        )}
                        {item.operating_hours && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {item.operating_hours}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                        <span className="font-bold text-ds-primary text-lg">
                          {formatPrice(item.price_per_hour, item.currency)}
                        </span>
                        <span className="px-3 py-1.5 text-xs font-semibold text-white bg-ds-primary rounded-lg group-hover:bg-ds-primary/90 transition-colors">{t(locale, 'parking.reserve_spot')}</span>
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
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">{t(locale, 'verticals.how_it_works')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'parking.step1_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'parking.step1_desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'parking.step2_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'parking.step2_desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'parking.step3_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'parking.step3_desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
