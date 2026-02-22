// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

const fallbackItems = [
  { id: "nl-1", name: "Tech Trends Weekly", topic: "technology", thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80", edition_date: "2026-02-10", topics_covered: ["AI & Machine Learning", "Web3 Updates", "Cloud Computing"], description: "Stay ahead with the latest technology trends, product launches, and industry insights." },
  { id: "nl-2", name: "Style & Living", topic: "lifestyle", thumbnail: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80", edition_date: "2026-02-08", topics_covered: ["Fashion Tips", "Interior Design", "Wellness"], description: "Your weekly guide to fashion, home design, and modern living." },
  { id: "nl-3", name: "Business Insider Report", topic: "business", thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80", edition_date: "2026-02-12", topics_covered: ["Market Analysis", "Startup News", "Investment Tips"], description: "Comprehensive business intelligence and market analysis for professionals." },
  { id: "nl-4", name: "Green Planet Digest", topic: "sustainability", thumbnail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80", edition_date: "2026-02-05", topics_covered: ["Climate Action", "Sustainable Products", "Eco-Innovations"], description: "Environmental news, sustainable living tips, and eco-friendly product reviews." },
  { id: "nl-5", name: "Health & Wellness Focus", topic: "health", thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80", edition_date: "2026-02-11", topics_covered: ["Nutrition Guide", "Fitness Plans", "Mental Health"], description: "Expert-backed health advice, workout routines, and nutrition guides." },
  { id: "nl-6", name: "The Deal Hunter", topic: "shopping", thumbnail: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80", edition_date: "2026-02-13", topics_covered: ["Best Deals", "Coupon Codes", "Product Reviews"], description: "Never miss a great deal — curated savings and product recommendations." },
]

export const Route = createFileRoute("/$tenant/$locale/newsletter/")({
  component: NewsletterPage,
  head: () => ({
    meta: [
      { title: "Newsletter | Dakkah CityOS" },
      { name: "description", content: "Subscribe to the Dakkah CityOS newsletter" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/newsletters`, {
        headers: {
          "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_b52dbbf895687445775c819d8cd5cb935f27231ef3a32ade606b58d9e5798d3a",
        },
      })
      if (!resp.ok) return { items: fallbackItems, count: fallbackItems.length }
      const data = await resp.json()
      const raw = data.items || data.newsletters || data.listings || []
      return { items: raw.length > 0 ? raw : fallbackItems, count: raw.length > 0 ? (data.count || raw.length) : fallbackItems.length }
    } catch {
      return { items: fallbackItems, count: fallbackItems.length }
    }
  },
})

const topicOptions = ["all", "technology", "lifestyle", "business", "sustainability", "health", "shopping"] as const

function NewsletterPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [topicFilter, setTopicFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesTopic = topicFilter === "all" || item.topic === topicFilter
    return matchesSearch && matchesTopic
  })

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary to-ds-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">{t(locale, 'newsletter.breadcrumb')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'newsletter.hero_title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, 'newsletter.hero_subtitle')}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} {t(locale, 'newsletter.editions_count')}</span>
            <span>|</span>
            <span>{t(locale, 'newsletter.badge_weekly')}</span>
            <span>|</span>
            <span>{t(locale, 'newsletter.badge_free')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'newsletter.search_label')}</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(locale, 'newsletter.search_placeholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'newsletter.topic_label')}</label>
                <div className="space-y-1">
                  {topicOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setTopicFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${topicFilter === opt ? "bg-ds-primary text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_topics') : opt.charAt(0).toUpperCase() + opt.slice(1)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'verticals.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'newsletter.no_results_hint')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-primary/40 transition-all duration-200"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-ds-primary/10 to-ds-primary/10 relative overflow-hidden">
                      {item.thumbnail ? (
                        <img loading="lazy" src={item.thumbnail} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-16 h-16 text-ds-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75" />
                          </svg>
                        </div>
                      )}
                      {item.topic && (
                        <span className="absolute top-2 start-2 px-2 py-1 text-xs font-medium bg-ds-primary text-white rounded-md capitalize">{item.topic}</span>
                      )}
                      {item.edition_date && (
                        <span className="absolute top-2 end-2 px-2 py-1 text-xs font-medium bg-ds-card/90 text-ds-foreground/80 rounded-md">
                          {new Date(item.edition_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-ds-foreground group-hover:text-ds-primary transition-colors line-clamp-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-ds-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                      )}

                      {item.topics_covered && (
                        <div className="mt-3">
                          <p className="text-xs text-ds-muted-foreground mb-1.5">{t(locale, 'newsletter.topics_covered')}:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {item.topics_covered.map((topic: string) => (
                              <span key={topic} className="px-2 py-0.5 bg-ds-info/10 text-ds-info rounded text-xs font-medium">{topic}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                        <span className="text-xs text-ds-muted-foreground">
                          {item.edition_date ? new Date(item.edition_date).toLocaleDateString() : t(locale, 'newsletter.recent_edition')}
                        </span>
                        <span className="px-4 py-1.5 text-xs font-semibold text-white bg-ds-primary rounded-lg group-hover:bg-ds-primary/90 transition-colors">{t(locale, 'newsletter.read_newsletter')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <section className="py-16 bg-ds-card border-t border-ds-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">{t(locale, 'newsletter.stay_connected')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'newsletter.step1_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'newsletter.step1_desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'newsletter.step2_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'newsletter.step2_desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">{t(locale, 'newsletter.step3_title')}</h3>
              <p className="text-sm text-ds-muted-foreground">{t(locale, 'newsletter.step3_desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
