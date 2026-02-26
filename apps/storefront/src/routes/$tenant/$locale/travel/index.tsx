// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/travel/")({
  component: TravelPage,
  head: () => ({
    meta: [
      { title: "Travel | Dakkah CityOS" },
      { name: "description", content: "Browse travel deals on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/travel/packages`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: [], count: 0 }
      const data = await resp.json()
      const raw = data.items || data.listings || data.products || []
      const items = raw.map((s: any) => {
        const meta = s.metadata || {}
        return {
          id: s.id,
          name: s.name || meta.name || "Untitled Stay",
          description: s.description || meta.description || "",
          thumbnail: s.thumbnail || meta.thumbnail || meta.images?.[0] || null,
          images: meta.images || [],
          property_type: s.property_type || meta.property_type || null,
          star_rating: s.star_rating || meta.star_rating || null,
          city: s.city || meta.city || null,
          country_code: s.country_code || meta.country_code || null,
          price: s.price || meta.price || null,
          currency: s.currency || s.currency_code || meta.currency || "SAR",
          amenities: s.amenities || meta.amenities || [],
          rating: s.rating || meta.rating || null,
          review_count: s.review_count || meta.review_count || 0,
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const propertyTypeOptions = ["all", "hotel", "resort", "hostel", "apartment", "villa"] as const
const starRatingOptions = ["all", "5", "4", "3", "2", "1"] as const

function TravelPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [propertyFilter, setPropertyFilter] = useState<string>("all")
  const [starFilter, setStarFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.city || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesProperty = propertyFilter === "all" || item.property_type === propertyFilter
    const matchesStar = starFilter === "all" || String(item.star_rating) === starFilter
    return matchesSearch && matchesProperty && matchesStar
  })

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return t(locale, 'verticals.contact_pricing')
    const amount = price >= 100 ? price / 100 : price
    return `${amount.toLocaleString()} ${currency}`
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-info/100 to-ds-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">Travel</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'travel.title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Book hotels, resorts, apartments, and unique stays for your next adventure.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} stays available</span>
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
                  placeholder={t(locale, 'travel.search_placeholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-info"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">Property Type</label>
                <div className="space-y-1">
                  {propertyTypeOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setPropertyFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${propertyFilter === opt ? "bg-ds-info text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_types') : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">Star Rating</label>
                <div className="space-y-1">
                  {starRatingOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setStarFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${starFilter === opt ? "bg-ds-info text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? "Any Rating" : (
                        <span className="flex items-center gap-1">
                          {Array.from({ length: Number(opt) }, (_, i) => (
                            <svg key={i} className="w-3.5 h-3.5 text-ds-warning" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ms-1">{opt} Star{Number(opt) > 1 ? "s" : ""}</span>
                        </span>
                      )}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'travel.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'verticals.try_adjusting')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => (
                  <a
                    key={item.id}
                    href={`${prefix}/travel/${item.id}`}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-info/40 transition-all duration-200"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-ds-info/10 to-ds-primary/15 relative overflow-hidden">
                      {item.thumbnail ? (
                        <img loading="lazy" src={item.thumbnail} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-16 h-16 text-ds-info/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                      {item.property_type && (
                        <span className="absolute top-2 start-2 px-2 py-1 text-xs font-medium bg-ds-info text-white rounded-md capitalize">{item.property_type}</span>
                      )}
                      {item.star_rating && (
                        <div className="absolute top-2 end-2 px-2 py-1 text-xs font-medium bg-ds-card/90 text-ds-foreground/80 rounded-md flex items-center gap-0.5">
                          {Array.from({ length: item.star_rating }, (_, i) => (
                            <svg key={i} className="w-3 h-3 text-ds-warning" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      )}
                      {item.images && item.images.length > 1 && (
                        <div className="absolute bottom-2 end-2 px-2 py-0.5 text-xs font-medium bg-black/50 text-white rounded-md flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {item.images.length}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-ds-foreground group-hover:text-ds-info transition-colors line-clamp-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-ds-muted-foreground mt-1.5 line-clamp-2">{item.description}</p>
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
                          <span className="text-xs text-ds-muted-foreground">{item.rating} ({item.review_count})</span>
                        </div>
                      )}

                      {item.city && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-ds-muted-foreground">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <span className="truncate">{[item.city, item.country_code].filter(Boolean).join(", ")}</span>
                        </div>
                      )}

                      {item.amenities && Array.isArray(item.amenities) && item.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.amenities.slice(0, 3).map((a: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-ds-info/10 text-ds-info border border-ds-info/30">{a}</span>
                          ))}
                          {item.amenities.length > 3 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-ds-muted text-ds-muted-foreground">+{item.amenities.length - 3}</span>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                        <div>
                          <span className="font-bold text-ds-info text-lg">
                            {formatPrice(item.price, item.currency)}
                          </span>
                          {item.price && <span className="text-xs text-ds-muted-foreground"> /night</span>}
                        </div>
                        <span className="px-3 py-1.5 text-xs font-semibold text-white bg-ds-info rounded-lg group-hover:bg-ds-info transition-colors">{t(locale, 'travel.book_now')}</span>
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
              <div className="w-12 h-12 rounded-full bg-ds-info text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Search Destinations</h3>
              <p className="text-sm text-ds-muted-foreground">Browse hotels, resorts, and stays by location, type, or star rating.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-info text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Compare & Book</h3>
              <p className="text-sm text-ds-muted-foreground">Compare amenities, reviews, and prices to find your perfect stay.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-info text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Enjoy Your Stay</h3>
              <p className="text-sm text-ds-muted-foreground">Receive your booking confirmation and enjoy a wonderful experience.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
