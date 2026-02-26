// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/real-estate/")({
  component: RealEstatePage,
  head: () => ({
    meta: [
      { title: "Real Estate | Dakkah CityOS" },
      { name: "description", content: "Browse real estate listings on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/real-estate/listings`, {
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
          title: s.title || meta.title || "Untitled Property",
          description: s.description || meta.description || "",
          thumbnail: s.thumbnail || meta.thumbnail || meta.images?.[0] || null,
          images: meta.images || [],
          listing_type: s.listing_type || meta.listing_type || null,
          property_type: s.property_type || meta.property_type || null,
          status: s.status || meta.status || null,
          price: s.price || meta.price || null,
          currency_code: s.currency_code || meta.currency_code || "SAR",
          address_line1: s.address_line1 || meta.address_line1 || null,
          city: s.city || meta.city || null,
          bedrooms: s.bedrooms || meta.bedrooms || null,
          bathrooms: s.bathrooms || meta.bathrooms || null,
          area_sqm: s.area_sqm || meta.area_sqm || null,
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const listingTypeOptions = ["all", "sale", "rent"] as const
const propertyTypeOptions = ["all", "apartment", "villa", "office", "land", "commercial"] as const

function RealEstatePage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [listingFilter, setListingFilter] = useState<string>("all")
  const [propertyFilter, setPropertyFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.city || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesListing = listingFilter === "all" || item.listing_type === listingFilter
    const matchesProperty = propertyFilter === "all" || item.property_type === propertyFilter
    return matchesSearch && matchesListing && matchesProperty
  })

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return t(locale, 'verticals.contact_pricing')
    const amount = price >= 100 ? price / 100 : price
    return `${amount.toLocaleString()} ${currency}`
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-success to-ds-success/90 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">{t(locale, 'realEstate.breadcrumb')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'realEstate.hero_title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, 'realEstate.hero_subtitle')}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} {t(locale, 'realEstate.properties_count')}</span>
            <span>|</span>
            <span>{t(locale, 'realEstate.badge_verified')}</span>
            <span>|</span>
            <span>{t(locale, 'realEstate.badge_sale_rent')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'realEstate.search_label')}</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(locale, 'realEstate.search_placeholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-success"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'realEstate.listing_type_label')}</label>
                <div className="space-y-1">
                  {listingTypeOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setListingFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${listingFilter === opt ? "bg-ds-success text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_listings') : opt === "sale" ? t(locale, 'verticals.for_sale') : t(locale, 'verticals.for_rent')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'realEstate.property_type_label')}</label>
                <div className="space-y-1">
                  {propertyTypeOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setPropertyFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${propertyFilter === opt ? "bg-ds-success text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_types') : opt.charAt(0).toUpperCase() + opt.slice(1)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'verticals.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'realEstate.no_results_hint')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => (
                  <a
                    key={item.id}
                    href={`${prefix}/real-estate/${item.id}`}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-success/40 transition-all duration-200"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-ds-success/10 to-ds-success/15 relative overflow-hidden">
                      {item.thumbnail ? (
                        <img loading="lazy" src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-16 h-16 text-ds-success/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                      )}
                      {item.listing_type && (
                        <span className={`absolute top-2 start-2 px-2 py-1 text-xs font-medium rounded-md ${item.listing_type === "sale" ? "bg-ds-success text-white" : "bg-ds-primary text-white"}`}>
                          {item.listing_type === "sale" ? t(locale, 'verticals.for_sale') : t(locale, 'verticals.for_rent')}
                        </span>
                      )}
                      {item.property_type && (
                        <span className="absolute top-2 end-2 px-2 py-1 text-xs font-medium bg-ds-card/90 text-ds-foreground/80 rounded-md capitalize">{item.property_type}</span>
                      )}
                      {item.images && item.images.length > 1 && (
                        <div className="absolute bottom-2 end-2 px-2 py-0.5 text-xs font-medium bg-black/50 text-white rounded-md flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {item.images.length}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-ds-foreground group-hover:text-ds-success transition-colors line-clamp-1">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-ds-muted-foreground mt-1.5 line-clamp-2">{item.description}</p>
                      )}

                      <p className="text-xl font-bold text-ds-success mt-2">
                        {formatPrice(item.price, item.currency_code)}
                        {item.listing_type === "rent" && <span className="text-xs font-normal text-ds-muted-foreground"> /month</span>}
                      </p>

                      <div className="flex items-center gap-4 mt-3 text-xs text-ds-muted-foreground">
                        {item.bedrooms != null && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                            {item.bedrooms} Beds
                          </span>
                        )}
                        {item.bathrooms != null && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            {item.bathrooms} Baths
                          </span>
                        )}
                        {item.area_sqm != null && (
                          <span>{item.area_sqm} m²</span>
                        )}
                      </div>

                      {item.city && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-ds-muted-foreground">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <span className="truncate">{[item.address_line1, item.city].filter(Boolean).join(", ")}</span>
                        </div>
                      )}

                      <div className="flex justify-end items-center pt-3 mt-3 border-t border-ds-border">
                        <span className="px-3 py-1.5 text-xs font-semibold text-white bg-ds-success rounded-lg group-hover:bg-ds-success/90 transition-colors">{t(locale, 'verticals.view_details')}</span>
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
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'realEstate.step1_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'realEstate.step1_desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'realEstate.step2_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'realEstate.step2_desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'realEstate.step3_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'realEstate.step3_desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
