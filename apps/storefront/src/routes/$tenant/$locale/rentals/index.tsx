// @ts-nocheck
import { t } from "@/lib/i18n"
import {
  getServerBaseUrl,
  fetchWithTimeout,
  getMedusaPublishableKey,
} from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/$tenant/$locale/rentals/")({
  component: RentalsPage,
  head: () => ({
    meta: [
      { title: "Rentals | Dakkah CityOS" },
      {
        name: "description",
        content: "Browse rental listings on Dakkah CityOS",
      },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/rentals`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: [], count: 0 }
      const data = await resp.json()
      const raw =
        data.items ||
        data.listings ||
        data.products ||
        data.services ||
        data.warranties ||
        data.plans ||
        []
      const items = raw.map((item: any) => {
        const meta = item.metadata || {}
        return {
          id: item.id,
          name: meta.name || item.name || "Untitled Rental",
          description: meta.description || item.description || "",
          rental_type: item.rental_type || meta.rental_type || null,
          currency_code: item.currency_code || meta.currency_code || "USD",
          min_duration: item.min_duration || meta.min_duration || null,
          max_duration: item.max_duration || meta.max_duration || null,
          is_available: item.is_available !== false,
          condition_on_listing:
            item.condition_on_listing || meta.condition || null,
          total_rentals: item.total_rentals || meta.total_rentals || 0,
          thumbnail:
            item.thumbnail || meta.thumbnail || meta.images?.[0] || null,
          images: meta.images || [],
          price: meta.price || item.price || null,
          category: meta.category || item.category || null,
          rating: meta.rating || item.rating || null,
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const rentalTypeOptions = [
  "all",
  "daily",
  "weekly",
  "monthly",
  "hourly",
] as const
const categoryOptions = [
  "all",
  "electronics",
  "vehicles",
  "equipment",
  "furniture",
  "tools",
  "sports",
  "clothing",
] as const

const rentalTypeLabels: Record<string, string> = {
  daily: "/day",
  weekly: "/week",
  monthly: "/month",
  hourly: "/hour",
}

const rentalTypeColors: Record<string, string> = {
  daily: "bg-ds-warning/15 text-ds-warning",
  weekly: "bg-ds-warning/15 text-ds-warning",
  monthly: "bg-ds-warning/15 text-ds-warning",
  hourly: "bg-ds-destructive/15 text-ds-destructive",
}

function RentalsPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []
  const [searchQuery, setSearchQuery] = useState("")
  const [rentalTypeFilter, setRentalTypeFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      : true
    const matchesType =
      rentalTypeFilter === "all" ||
      item.rental_type?.toLowerCase() === rentalTypeFilter
    const matchesCategory =
      categoryFilter === "all" ||
      item.category?.toLowerCase() === categoryFilter
    return matchesSearch && matchesType && matchesCategory
  })

  const formatPrice = (
    price: number | null,
    currency: string,
    rentalType: string | null,
  ) => {
    if (!price) return t(locale, "verticals.contact_pricing")
    const amount = price >= 100 ? price / 100 : price
    const period = rentalTypeLabels[rentalType?.toLowerCase() || ""] || ""
    return `${amount.toLocaleString()} ${currency}${period}`
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-warning to-ds-warning text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link
              to={`${prefix}` as never}
              className="hover:text-white transition-colors"
            >
              {t(locale, "common.home")}
            </Link>
            <span>/</span>
            <span className="text-white">Rentals</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t(locale, "rentals.title")}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Rent equipment, vehicles, electronics, and more — flexible
            durations, affordable rates, and hassle-free returns.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} items available</span>
            <span>|</span>
            <span>
              {t(locale, "rentals.badge_flexible_terms", "Flexible terms")}
            </span>
            <span>|</span>
            <span>
              {t(locale, "rentals.badge_easy_returns", "Easy returns")}
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
                  placeholder={t(locale, "rentals.search_placeholder")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-warning"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">
                  Rental Type
                </label>
                <div className="space-y-1">
                  {rentalTypeOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setRentalTypeFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${rentalTypeFilter === opt ? "bg-ds-warning text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all"
                        ? t(locale, "verticals.all_types")
                        : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">
                  {t(locale, "verticals.category_label")}
                </label>
                <div className="space-y-1">
                  {categoryOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setCategoryFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${categoryFilter === opt ? "bg-ds-warning text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all"
                        ? t(locale, "verticals.all_categories")
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">
                  {t(locale, "rentals.no_results")}
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
                    href={`${prefix}/rentals/${item.id}`}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-warning/40 transition-all duration-200"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-ds-warning/10 to-ds-warning/15 relative overflow-hidden">
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
                            className="w-16 h-16 text-ds-warning/40"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        </div>
                      )}
                      {item.rental_type && (
                        <span
                          className={`absolute top-2 start-2 px-2 py-1 text-xs font-medium rounded-md capitalize ${rentalTypeColors[item.rental_type?.toLowerCase()] || "bg-ds-muted text-ds-foreground/80"}`}
                        >
                          {item.rental_type}
                        </span>
                      )}
                      <span
                        className={`absolute top-2 end-2 px-2 py-1 text-xs font-medium rounded-md ${item.is_available ? "bg-ds-success/15 text-ds-success" : "bg-ds-destructive/15 text-ds-destructive"}`}
                      >
                        {item.is_available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-ds-foreground group-hover:text-ds-warning transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-ds-muted-foreground mt-1.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-3 text-xs text-ds-muted-foreground flex-wrap">
                        {item.condition_on_listing && (
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {item.condition_on_listing}
                          </span>
                        )}
                        {item.total_rentals > 0 && (
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
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            {item.total_rentals} rentals
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
                            {item.rating}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                        <span className="font-bold text-ds-warning text-lg">
                          {formatPrice(
                            item.price,
                            item.currency_code,
                            item.rental_type,
                          )}
                        </span>
                        <span className="px-3 py-1.5 text-xs font-semibold text-white bg-ds-warning rounded-lg group-hover:bg-ds-warning transition-colors">
                          {t(locale, "rentals.rent_now")}
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
              <div className="w-12 h-12 rounded-full bg-ds-warning text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Find What You Need
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Browse our wide selection of rental items across multiple
                categories.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-warning text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Choose Your Duration
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Select hourly, daily, weekly, or monthly rental periods that fit
                your schedule.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-warning text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Enjoy & Return
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Use your rented item and return it when done — hassle-free
                process.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
