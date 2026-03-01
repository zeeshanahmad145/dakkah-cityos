// @ts-nocheck
import {
  getServerBaseUrl,
  fetchWithTimeout,
  getMedusaPublishableKey,
} from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/classifieds/")({
  component: ClassifiedsPage,
  head: () => ({
    meta: [
      { title: "Classifieds | Dakkah CityOS" },
      {
        name: "description",
        content: "Browse classified listings on Dakkah CityOS",
      },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/classifieds`, {
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
          title: s.title || meta.title || "Untitled Listing",
          description: s.description || meta.description || "",
          thumbnail: s.thumbnail || meta.thumbnail || meta.images?.[0] || null,
          images: meta.images || [],
          price: meta.price || null,
          currency: s.currency_code || meta.currency || "SAR",
          category_id: s.category_id || null,
          listing_type: s.listing_type || null,
          condition: s.condition || null,
          is_negotiable: s.is_negotiable || false,
          location_city: s.location_city || null,
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const conditionOptions = [
  "all",
  "new",
  "like_new",
  "good",
  "fair",
  "for_parts",
] as const
const listingTypeOptions = ["all", "sale", "wanted", "trade"] as const

function ClassifiedsPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [conditionFilter, setConditionFilter] = useState<string>("all")
  const [listingTypeFilter, setListingTypeFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      : true
    const matchesCondition =
      conditionFilter === "all" || item.condition === conditionFilter
    const matchesType =
      listingTypeFilter === "all" || item.listing_type === listingTypeFilter
    return matchesSearch && matchesCondition && matchesType
  })

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return t(locale, "verticals.contact_pricing")
    const amount = price >= 100 ? price / 100 : price
    return `${amount.toLocaleString()} ${currency}`
  }

  const conditionLabel = (c: string) => {
    const map: Record<string, string> = {
      new: "New",
      like_new: "Like New",
      good: "Good",
      fair: "Fair",
      for_parts: "For Parts",
    }
    return map[c] || c
  }

  const conditionColor = (c: string) => {
    if (c === "new") return "bg-ds-success text-white"
    if (c === "like_new") return "bg-ds-success text-white"
    if (c === "good") return "bg-ds-warning text-white"
    if (c === "fair") return "bg-ds-warning text-white"
    return "bg-ds-destructive text-white"
  }

  const listingTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      sale: t(locale, "verticals.for_sale"),
      wanted: "Wanted",
      trade: "Trade",
    }
    return map[type] || type
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
            <span className="text-white">Classifieds</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t(locale, "classifieds.title")}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Buy, sell, and trade items in your local community. Find great deals
            on everything you need.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} listings available</span>
            <span>|</span>
            <span>{t(locale, "verticals.verified_providers")}</span>
            <span>|</span>
            <span>{t(locale, "verticals.secure_transactions")}</span>
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
                  placeholder={t(locale, "classifieds.search_placeholder")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-warning"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">
                  {t(locale, "verticals.condition_label")}
                </label>
                <div className="space-y-1">
                  {conditionOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setConditionFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${conditionFilter === opt ? "bg-ds-warning text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all"
                        ? t(locale, "verticals.all_conditions")
                        : conditionLabel(opt)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">
                  {t(locale, "verticals.listing_type_label")}
                </label>
                <div className="space-y-1">
                  {listingTypeOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setListingTypeFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${listingTypeFilter === opt ? "bg-ds-warning text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all"
                        ? t(locale, "verticals.all_types")
                        : listingTypeLabel(opt)}
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">
                  {t(locale, "classifieds.no_results")}
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
                    href={`${prefix}/classifieds/${item.id}`}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-warning/40 transition-all duration-200"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-ds-warning/10 to-ds-warning/15 relative overflow-hidden">
                      {item.thumbnail ? (
                        <img
                          loading="lazy"
                          src={item.thumbnail}
                          alt={item.title}
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
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                        </div>
                      )}
                      {item.condition && (
                        <span
                          className={`absolute top-2 start-2 px-2 py-1 text-xs font-medium rounded-md ${conditionColor(item.condition)}`}
                        >
                          {conditionLabel(item.condition)}
                        </span>
                      )}
                      {item.listing_type && (
                        <span className="absolute top-2 end-2 px-2 py-1 text-xs font-medium bg-ds-card/90 text-ds-foreground/80 rounded-md">
                          {listingTypeLabel(item.listing_type)}
                        </span>
                      )}
                      {item.images && item.images.length > 1 && (
                        <div className="absolute bottom-2 end-2 px-2 py-0.5 text-xs font-medium bg-black/50 text-white rounded-md flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {item.images.length}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-ds-foreground group-hover:text-ds-warning transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-ds-muted-foreground mt-1.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <span className="font-bold text-ds-warning text-lg">
                          {formatPrice(item.price, item.currency)}
                        </span>
                        {item.is_negotiable && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-ds-warning/15 text-ds-warning rounded-full">
                            Negotiable
                          </span>
                        )}
                      </div>

                      {item.location_city && (
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
                          <span className="truncate">{item.location_city}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                        <span className="text-xs text-ds-muted-foreground capitalize">
                          {item.listing_type || "Listing"}
                        </span>
                        <span className="px-3 py-1.5 text-xs font-semibold text-white bg-ds-warning rounded-lg group-hover:bg-ds-warning/90 transition-colors">
                          View Listing
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
                Browse Listings
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Search through thousands of items listed by verified sellers in
                your area.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-warning text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Contact Seller
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Reach out to the seller directly to negotiate and arrange a
                meeting.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-warning text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Complete the Deal
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Meet safely, inspect the item, and complete your transaction
                securely.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
