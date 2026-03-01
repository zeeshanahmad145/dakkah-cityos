// @ts-nocheck
import {
  getServerBaseUrl,
  fetchWithTimeout,
  getMedusaPublishableKey,
} from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/bundles/")({
  component: BundlesPage,
  head: () => ({
    meta: [
      { title: "Bundles | Dakkah CityOS" },
      {
        name: "description",
        content: "Browse product bundles on Dakkah CityOS",
      },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/bundles`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: [], count: 0 }
      const data = await resp.json()
      const raw = data.bundles || data.items || []
      const items = raw.map((b: any) => {
        const meta = b.metadata || {}
        return {
          id: b.id,
          name: meta.name || b.name || b.title || "Untitled Bundle",
          description: meta.description || b.description || "",
          thumbnail:
            b.thumbnail ||
            meta.thumbnail ||
            meta.image ||
            (meta.images && meta.images[0]) ||
            b.thumbnail ||
            null,
          images: meta.images || b.images || [],
          price: meta.price || b.price || null,
          original_price: meta.original_price || b.original_price || null,
          savings: meta.savings || b.savings || null,
          currency: meta.currency || b.currency || "USD",
          items_count:
            meta.items_count ||
            (meta.items && meta.items.length) ||
            b.items_count ||
            0,
          items_list: meta.items || b.items || [],
          category: meta.category || b.category || null,
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const categoryOptions = [
  "all",
  "electronics",
  "fashion",
  "home",
  "beauty",
  "food",
  "fitness",
  "office",
] as const

function BundlesPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      : true
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return t(locale, "verticals.contact_pricing")
    const amount = price >= 100 ? price / 100 : price
    return `${amount.toLocaleString()} ${currency}`
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-rose-500 to-ds-destructive text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link
              to={`${prefix}` as never}
              className="hover:text-white transition-colors"
            >
              {t(locale, "common.home")}
            </Link>
            <span>/</span>
            <span className="text-white">Bundles</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t(locale, "bundles.title")}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, "bundles.subtitle")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} bundles available</span>
            <span>|</span>
            <span>
              {t(locale, "bundles.badge_great_savings", "Great savings")}
            </span>
            <span>|</span>
            <span>
              {t(
                locale,
                "bundles.badge_curated_selections",
                "Curated selections",
              )}
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
                  placeholder={t(locale, "bundles.search_placeholder")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
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
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${categoryFilter === opt ? "bg-ds-primary text-ds-primary-foreground" : "text-ds-foreground hover:bg-ds-muted"}`}
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
                  {t(locale, "bundles.no_results")}
                </h3>
                <p className="text-ds-muted-foreground text-sm">
                  {t(locale, "verticals.try_adjusting")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-rose-300 transition-all duration-200"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-rose-50 to-ds-destructive/15 relative overflow-hidden">
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
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        </div>
                      )}
                      {item.savings && (
                        <span className="absolute top-2 start-2 px-2 py-1 text-xs font-bold bg-rose-500 text-white rounded-md">
                          Save{" "}
                          {typeof item.savings === "number"
                            ? formatPrice(item.savings, item.currency)
                            : item.savings}
                        </span>
                      )}
                      {item.category && (
                        <span className="absolute top-2 end-2 px-2 py-1 text-xs font-medium bg-ds-card/90 text-ds-foreground/80 rounded-md capitalize">
                          {item.category}
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
                      <h3 className="font-semibold text-ds-foreground group-hover:text-rose-600 transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-ds-muted-foreground mt-1.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-3 text-xs text-ds-muted-foreground">
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
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                          {item.items_count} items included
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                        <div>
                          {item.original_price && (
                            <span className="text-sm text-ds-muted-foreground line-through me-2">
                              {formatPrice(item.original_price, item.currency)}
                            </span>
                          )}
                          <span className="font-bold text-rose-600 text-lg">
                            {formatPrice(item.price, item.currency)}
                          </span>
                        </div>
                        <button className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-500 rounded-lg hover:bg-rose-600 transition-colors">
                          {t(locale, "bundles.add_bundle")}
                        </button>
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
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">
            {t(locale, "bundles.why_buy_bundles")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                💰
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Save More
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Get significant discounts when you buy items together as a
                bundle.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                🎯
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Curated Selection
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Each bundle is carefully curated with complementary products.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                🚀
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                One-Click Add
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Add the entire bundle to your cart with a single click.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
