// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/pet-services/")({
  component: PetServicesPage,
  head: () => ({
    meta: [
      { title: "Pet Services | Dakkah CityOS" },
      { name: "description", content: "Browse pet services on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/pet-services`, {
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
          name: item.name || meta.name || "Unnamed Pet",
          species: item.species || meta.species || null,
          breed: item.breed || meta.breed || null,
          weight: item.weight || meta.weight || null,
          gender: item.gender || meta.gender || null,
          age: item.age || meta.age || null,
          thumbnail: item.thumbnail || meta.thumbnail || meta.images?.[0] || null,
          images: meta.images || [],
          description: item.description || meta.description || "",
          color: item.color || meta.color || null,
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const speciesOptions = ["all", "dog", "cat", "bird", "fish", "reptile", "rabbit"] as const

function PetServicesPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [speciesFilter, setSpeciesFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.breed || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesSpecies = speciesFilter === "all" || item.species === speciesFilter
    return matchesSearch && matchesSpecies
  })

  const speciesEmoji = (species: string) => {
    const map: Record<string, string> = { dog: "🐕", cat: "🐱", bird: "🐦", fish: "🐟", reptile: "🦎", rabbit: "🐰" }
    return map[species] || "🐾"
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-destructive to-rose-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">{t(locale, 'petService.breadcrumb')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'petService.hero_title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, 'petService.hero_subtitle')}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} {t(locale, 'petService.pets_count')}</span>
            <span>|</span>
            <span>{t(locale, 'petService.badge_verified')}</span>
            <span>|</span>
            <span>{t(locale, 'petService.badge_all_breeds')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'petService.search_label')}</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(locale, 'petService.search_placeholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-destructive"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'petService.species_label')}</label>
                <div className="space-y-1">
                  {speciesOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSpeciesFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${speciesFilter === opt ? "bg-ds-destructive text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_species') : `${speciesEmoji(opt)} ${opt.charAt(0).toUpperCase() + opt.slice(1)}`}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'verticals.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'petService.no_results_hint')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => (
                  <a
                    key={item.id}
                    href={`${prefix}/pet-services/${item.id}`}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-destructive/40 transition-all duration-200"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-ds-destructive/10 to-rose-100 relative overflow-hidden">
                      {item.thumbnail ? (
                        <img loading="lazy" src={item.thumbnail} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl">{speciesEmoji(item.species || "")}</span>
                        </div>
                      )}
                      {item.species && (
                        <span className="absolute top-2 start-2 px-2 py-1 text-xs font-medium bg-ds-destructive text-white rounded-md capitalize">
                          {speciesEmoji(item.species)} {item.species}
                        </span>
                      )}
                      {item.images && item.images.length > 1 && (
                        <div className="absolute bottom-2 end-2 px-2 py-0.5 text-xs font-medium bg-black/50 text-white rounded-md flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {item.images.length}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-ds-foreground group-hover:text-ds-destructive transition-colors line-clamp-1">{item.name}</h3>
                      {item.breed && (
                        <p className="text-sm text-ds-muted-foreground mt-0.5">{item.breed}</p>
                      )}

                      <div className="flex items-center gap-3 mt-3 text-xs text-ds-muted-foreground flex-wrap">
                        {item.gender && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            {item.gender.charAt(0).toUpperCase() + item.gender.slice(1)}
                          </span>
                        )}
                        {item.weight && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5" /></svg>
                            {item.weight} lbs
                          </span>
                        )}
                        {item.age && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {item.age}
                          </span>
                        )}
                      </div>

                      {item.color && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-ds-muted-foreground">
                          <span>Color: {item.color}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                        <span className="text-sm text-ds-muted-foreground">{t(locale, 'petService.pet_profile')}</span>
                        <span className="px-3 py-1.5 text-xs font-semibold text-white bg-ds-destructive rounded-lg group-hover:bg-ds-destructive/90 transition-colors">{t(locale, 'petService.view_profile')}</span>
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
              <div className="w-12 h-12 rounded-full bg-ds-destructive text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'petService.step1_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'petService.step1_desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-destructive text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'petService.step2_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'petService.step2_desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-destructive text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'petService.step3_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'petService.step3_desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
