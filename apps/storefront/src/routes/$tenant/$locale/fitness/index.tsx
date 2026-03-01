// @ts-nocheck
import {
  getServerBaseUrl,
  fetchWithTimeout,
  getMedusaPublishableKey,
} from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/fitness/")({
  component: FitnessPage,
  head: () => ({
    meta: [
      { title: "Fitness | Dakkah CityOS" },
      {
        name: "description",
        content: "Browse fitness services on Dakkah CityOS",
      },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/fitness/classes`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: [], count: 0 }
      const data = await resp.json()
      const raw =
        data.fitness_listings ||
        data.classes ||
        data.items ||
        data.listings ||
        data.products ||
        []
      const items = raw.map((c: any) => {
        const meta = c.metadata || {}
        return {
          id: c.id,
          name: meta.name || c.name || c.title || "Untitled Class",
          description: meta.description || c.description || "",
          class_type:
            meta.class_type || c.class_type || c.type || c.category || null,
          instructor: meta.instructor || c.instructor || c.trainer || null,
          schedule: meta.schedule || c.schedule || null,
          duration: meta.duration || c.duration || c.duration_minutes || null,
          capacity: meta.capacity || c.capacity || c.max_capacity || null,
          price: meta.price || c.price || null,
          currency: meta.currency || c.currency || "USD",
          thumbnail:
            c.thumbnail ||
            meta.thumbnail ||
            meta.image ||
            c.image_url ||
            c.thumbnail ||
            null,
          level: meta.level || c.level || null,
          rating: meta.rating || c.rating || null,
          review_count: meta.review_count || c.review_count || 0,
          location: meta.location || c.location || null,
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const classTypeOptions = [
  "all",
  "yoga",
  "pilates",
  "hiit",
  "spinning",
  "boxing",
  "crossfit",
  "swimming",
] as const

function FitnessPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [classTypeFilter, setClassTypeFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.instructor || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      : true
    const matchesType =
      classTypeFilter === "all" ||
      (item.class_type || "").toLowerCase() === classTypeFilter
    return matchesSearch && matchesType
  })

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return "Free"
    const amount = price >= 100 ? price / 100 : price
    return `${amount.toLocaleString()} ${currency}`
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-destructive to-rose-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link
              to={`${prefix}` as never}
              className="hover:text-white transition-colors"
            >
              {t(locale, "common.home")}
            </Link>
            <span>/</span>
            <span className="text-white">Fitness</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t(locale, "fitness.title")}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Find the perfect class to reach your fitness goals. From yoga to
            HIIT, we have it all.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} classes available</span>
            <span>|</span>
            <span>
              {t(
                locale,
                "fitness.badge_expert_instructors",
                "Expert instructors",
              )}
            </span>
            <span>|</span>
            <span>
              {t(locale, "fitness.badge_all_levels", "All fitness levels")}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">
                  {t(locale, "verticals.search_label")}
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(locale, "fitness.search_placeholder")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">
                  Class Type
                </label>
                <div className="space-y-1">
                  {classTypeOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setClassTypeFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${classTypeFilter === opt ? "bg-ds-primary text-ds-primary-foreground" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all"
                        ? t(locale, "verticals.all_types")
                        : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            {filteredItems.length === 0 ? (
              <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
                <svg
                  className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">
                  {t(locale, "fitness.no_results")}
                </h3>
                <p className="text-ds-muted-foreground text-sm">
                  {t(locale, "verticals.try_adjusting")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => (
                  <a
                    key={item.id}
                    href={`${prefix}/fitness/${item.id}`}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-rose-300 transition-all duration-200"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-ds-destructive/10 to-rose-100 relative overflow-hidden">
                      {item.thumbnail ? (
                        <img
                          loading="lazy"
                          src={item.thumbnail}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-16 h-16 text-rose-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </div>
                      )}
                      {item.class_type && (
                        <span className="absolute top-2 start-2 px-2 py-1 text-xs font-medium bg-ds-destructive text-white rounded-md capitalize">
                          {item.class_type}
                        </span>
                      )}
                      {item.level && (
                        <span className="absolute top-2 end-2 px-2 py-1 text-xs font-medium bg-ds-card/90 text-ds-foreground/80 rounded-md capitalize">
                          {item.level}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-ds-foreground group-hover:text-rose-600 transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      {item.instructor && (
                        <p className="text-xs text-ds-muted-foreground mt-0.5">
                          with {item.instructor}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-sm text-ds-muted-foreground mt-1.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-3 text-xs text-ds-muted-foreground">
                        {item.schedule && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            {item.schedule}
                          </span>
                        )}
                        {item.duration && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {item.duration} min
                          </span>
                        )}
                        {item.capacity && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {item.capacity} spots
                          </span>
                        )}
                      </div>

                      {item.rating && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-3.5 h-3.5 ${star <= Math.round(item.rating) ? "text-ds-warning" : "text-ds-border"}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs text-ds-muted-foreground">
                            {item.rating} ({item.review_count})
                          </span>
                        </div>
                      )}

                      {item.location && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-ds-muted-foreground">
                          <svg
                            className="w-3.5 h-3.5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="truncate">{item.location}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                        <span className="font-bold text-rose-600 text-lg">
                          {formatPrice(item.price, item.currency)}
                        </span>
                        <span className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-500 rounded-lg group-hover:bg-rose-600 transition-colors">
                          {t(locale, "fitness.join_class")}
                        </span>
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
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">
            {t(locale, "verticals.how_it_works")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                💪
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Expert Instructors
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Certified professionals guiding you every step of the way.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                📅
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Flexible Schedule
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Morning, afternoon, and evening classes to fit your lifestyle.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                🏆
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                All Levels Welcome
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                From beginners to advanced athletes, there is a class for you.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
