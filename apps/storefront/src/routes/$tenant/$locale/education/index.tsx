// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/education/")({
  component: EducationPage,
  head: () => ({
    meta: [
      { title: "Education | Dakkah CityOS" },
      { name: "description", content: "Browse educational courses on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/education`, {
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
          title: item.title || meta.title || "Untitled Course",
          description: item.description || meta.description || "",
          short_description: item.short_description || meta.short_description || "",
          category: item.category || meta.category || null,
          subcategory: item.subcategory || meta.subcategory || null,
          level: item.level || meta.level || null,
          format: item.format || meta.format || null,
          language: item.language || meta.language || null,
          currency_code: item.currency_code || meta.currency_code || "USD",
          thumbnail: item.thumbnail || meta.thumbnail || meta.images?.[0] || null,
          images: meta.images || [],
          price: meta.price || item.price || null,
          rating: meta.rating || item.rating || null,
          instructor_name: meta.instructor_name || item.instructor_name || null,
          enrolled_count: meta.enrolled_count || item.enrolled_count || 0,
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const categoryOptions = ["all", "technology", "business", "language", "arts", "science", "health"] as const
const levelOptions = ["all", "beginner", "intermediate", "advanced"] as const
const formatOptions = ["all", "online", "in_person", "hybrid"] as const

const levelColors: Record<string, string> = {
  beginner: "bg-ds-success/15 text-ds-success",
  intermediate: "bg-ds-info/15 text-ds-info",
  advanced: "bg-ds-primary/15 text-ds-primary",
}

const formatLabels: Record<string, string> = {
  online: "Online",
  in_person: "In Person",
  hybrid: "Hybrid",
}

function EducationPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [formatFilter, setFormatFilter] = useState<string>("all")

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.short_description || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesCategory = categoryFilter === "all" || item.category?.toLowerCase() === categoryFilter
    const matchesLevel = levelFilter === "all" || item.level?.toLowerCase() === levelFilter
    const matchesFormat = formatFilter === "all" || item.format?.toLowerCase() === formatFilter
    return matchesSearch && matchesCategory && matchesLevel && matchesFormat
  })

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return "Free"
    const amount = price >= 100 ? price / 100 : price
    return `${amount.toLocaleString()} ${currency}`
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary to-ds-primary/90 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">Education</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'education.title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Expand your knowledge with expert-led courses, workshops, and programs across a wide range of topics.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} courses available</span>
            <span>|</span>
            <span>{t(locale, "education.badge_expert_instructors", "Expert instructors")}</span>
            <span>|</span>
            <span>{t(locale, "education.badge_flexible_learning", "Flexible learning")}</span>
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
                  placeholder={t(locale, 'education.search_placeholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'verticals.category_label')}</label>
                <div className="space-y-1">
                  {categoryOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setCategoryFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${categoryFilter === opt ? "bg-ds-primary text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_categories') : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'verticals.level_label')}</label>
                <div className="space-y-1">
                  {levelOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setLevelFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${levelFilter === opt ? "bg-ds-primary text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_levels') : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'verticals.format_label')}</label>
                <div className="space-y-1">
                  {formatOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setFormatFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${formatFilter === opt ? "bg-ds-primary text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_formats') : formatLabels[opt] || opt.charAt(0).toUpperCase() + opt.slice(1)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'education.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'verticals.try_adjusting')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => (
                  <a
                    key={item.id}
                    href={`${prefix}/education/${item.id}`}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-primary/40 transition-all duration-200"
                  >
                    <div className="aspect-video bg-gradient-to-br from-ds-primary/10 to-ds-primary/15 relative overflow-hidden">
                      {item.thumbnail ? (
                        <img loading="lazy" src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-16 h-16 text-ds-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                      {item.level && (
                        <span className={`absolute top-2 start-2 px-2 py-1 text-xs font-medium rounded-md capitalize ${levelColors[item.level?.toLowerCase()] || "bg-ds-muted text-ds-foreground/80"}`}>{item.level}</span>
                      )}
                      {item.format && (
                        <span className="absolute top-2 end-2 px-2 py-1 text-xs font-medium bg-ds-card/90 text-ds-foreground/80 rounded-md">
                          {formatLabels[item.format?.toLowerCase()] || item.format}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-ds-foreground group-hover:text-ds-primary transition-colors line-clamp-2">{item.title}</h3>
                      {item.instructor_name && (
                        <p className="text-xs text-ds-muted-foreground mt-0.5">by {item.instructor_name}</p>
                      )}
                      {item.short_description && (
                        <p className="text-sm text-ds-muted-foreground mt-1.5 line-clamp-2">{item.short_description}</p>
                      )}

                      <div className="flex items-center gap-3 mt-3 text-xs text-ds-muted-foreground">
                        {item.enrolled_count > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {item.enrolled_count.toLocaleString()} enrolled
                          </span>
                        )}
                        {item.category && (
                          <span className="capitalize">{item.category}</span>
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
                        <span className="font-bold text-ds-primary text-lg">
                          {formatPrice(item.price, item.currency_code)}
                        </span>
                        <span className="px-3 py-1.5 text-xs font-semibold text-white bg-ds-primary rounded-lg group-hover:bg-ds-primary/90 transition-colors">{t(locale, 'education.enroll_now')}</span>
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
              <h3 className="font-semibold text-ds-foreground mb-2">Browse Courses</h3>
              <p className="text-sm text-ds-muted-foreground">Explore our catalog of expert-led courses across multiple disciplines.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Enroll & Learn</h3>
              <p className="text-sm text-ds-muted-foreground">Sign up for your chosen course and start learning at your own pace.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Get Certified</h3>
              <p className="text-sm text-ds-muted-foreground">Complete the course and earn a certificate to showcase your skills.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
