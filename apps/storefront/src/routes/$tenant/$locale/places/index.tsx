// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/places/")({
  component: PlacesPage,
  head: () => ({
    meta: [
      { title: "Places | Dakkah CityOS" },
      { name: "description", content: "Discover places on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const places = [
        { id: "1", name: "Grand Mosque (Masjid al-Haram)", description: "The largest mosque in the world, surrounding Islam's holiest place, the Kaaba in Mecca.", category: "Religious", rating: 4.9, reviews: 12500, location: "Mecca, Saudi Arabia", image: "/seed-images/content/1586724237569-f3d0c1dee8c6.jpg" },
        { id: "2", name: "Souq Al-Zal", description: "Historic marketplace in Riyadh known for traditional crafts, antiques, and authentic Arabian goods.", category: "Shopping", rating: 4.5, reviews: 3200, location: "Riyadh, Saudi Arabia", image: "/seed-images/content/1548013146-72479768bada.jpg" },
        { id: "3", name: "Kingdom Tower", description: "Iconic 99-floor skyscraper with a sky bridge offering panoramic views of Riyadh's skyline.", category: "Landmark", rating: 4.7, reviews: 8900, location: "Riyadh, Saudi Arabia", image: "/seed-images/content/1573164713988-8665fc963095.jpg" },
        { id: "4", name: "Al Masmak Fort", description: "Historic clay and mud-brick fortress that played a key role in the founding of Saudi Arabia.", category: "Historical", rating: 4.6, reviews: 5600, location: "Riyadh, Saudi Arabia", image: "/seed-images/content/1558171813-4c088753af8f.jpg" },
        { id: "5", name: "Edge of the World", description: "Dramatic cliff formation northwest of Riyadh offering breathtaking views of the endless desert.", category: "Nature", rating: 4.8, reviews: 4200, location: "Riyadh Province, Saudi Arabia", image: "/seed-images/content/1682687220742-aba13b6e50ba.jpg" },
        { id: "6", name: "Al-Ula Heritage Village", description: "Ancient village with remarkable rock formations and the UNESCO World Heritage site of Hegra.", category: "Heritage", rating: 4.9, reviews: 6700, location: "Al-Ula, Saudi Arabia", image: "/seed-images/content/1519167758481-83f550bb49b3.jpg" },
        { id: "7", name: "Jeddah Corniche", description: "Beautiful waterfront promenade stretching along the Red Sea with parks, sculptures, and dining.", category: "Leisure", rating: 4.4, reviews: 7800, location: "Jeddah, Saudi Arabia", image: "/seed-images/content/1578662996442-48f60103fc96.jpg" },
        { id: "8", name: "Diriyah", description: "Historic seat of the first Saudi state, now a cultural destination with museums and restaurants.", category: "Heritage", rating: 4.7, reviews: 4500, location: "Riyadh, Saudi Arabia", image: "/seed-images/content/1454165804606-c3d57bc86b40.jpg" },
      ]
      return { places }
    } catch {
      return { places: [] }
    }
  },
})

const categoryOptions = ["all", "Religious", "Shopping", "Landmark", "Historical", "Nature", "Heritage", "Leisure"] as const

function PlacesPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const data = Route.useLoaderData()
  const places = data?.places || []

  const filtered = places.filter((p: any) => {
    const matchSearch = searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()) : true
    const matchCat = categoryFilter === "all" || p.category === categoryFilter
    return matchSearch && matchCat
  })

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-success to-ds-info text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">{t(locale, 'places.breadcrumb')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'places.hero_title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">{t(locale, 'places.hero_subtitle')}</p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{places.length} {t(locale, 'places.places_count')}</span><span>|</span><span>{t(locale, 'places.badge_curated')}</span><span>|</span><span>{t(locale, 'places.badge_ratings')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t(locale, 'places.search_placeholder')} className="flex-1 max-w-md px-4 py-2.5 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-success" />
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((opt) => (
              <button key={opt} onClick={() => setCategoryFilter(opt)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${categoryFilter === opt ? "bg-ds-success text-white" : "bg-ds-muted text-ds-foreground hover:bg-ds-muted/80"}`}>
                {opt === "all" ? "All" : opt}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
            <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'verticals.no_results')}</h3>
            <p className="text-ds-muted-foreground text-sm">{t(locale, 'places.no_results_hint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((place: any) => (
              <div key={place.id} className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-success/40 transition-all duration-200">
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img loading="lazy" src={place.image} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2 start-2 px-2 py-1 text-xs font-medium bg-ds-success text-white rounded-md">{place.category}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-ds-foreground group-hover:text-ds-success transition-colors line-clamp-1">{place.name}</h3>
                  <p className="text-sm text-ds-muted-foreground mt-1 line-clamp-2">{place.description}</p>
                  <div className="flex items-center gap-1.5 mt-3">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className={`w-3.5 h-3.5 ${star <= Math.round(place.rating) ? "text-ds-warning" : "text-ds-border"}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </div>
                    <span className="text-xs text-ds-muted-foreground">{place.rating} ({place.reviews.toLocaleString()})</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-ds-muted-foreground">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                    <span className="truncate">{place.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
