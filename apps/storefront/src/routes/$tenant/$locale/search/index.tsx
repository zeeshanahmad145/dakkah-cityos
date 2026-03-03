// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/search/")({
  component: SearchPage,
  head: () => ({
    meta: [
      { title: "Search | Dakkah CityOS" },
      {
        name: "description",
        content:
          "Search products, services, bookings and more on Dakkah CityOS",
      },
    ],
  }),
  validateSearch: (search: Record<string, string>) => ({
    q: search.q ?? "",
    category: search.category ?? "",
    sort: search.sort ?? "relevance",
  }),
})

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Products", value: "good" },
  { label: "Bookings", value: "service" },
  { label: "Digital", value: "digital" },
  { label: "Real Estate", value: "real_estate" },
  { label: "Travel", value: "travel" },
  { label: "Freelance", value: "freelance" },
]

const SORT_OPTIONS = [
  { label: "Relevance", value: "relevance" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Newest", value: "created_at_desc" },
]

function SearchPage() {
  const { tenant, locale } = Route.useParams()
  const search = Route.useSearch()
  const prefix = `/${tenant}/${locale}`
  const [query, setQuery] = useState(search.q ?? "")
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [activeCategory, setActiveCategory] = useState(search.category ?? "")

  const doSearch = async (q: string, category = activeCategory) => {
    if (!q.trim()) return
    setIsLoading(true)
    setHasSearched(true)
    try {
      const params = new URLSearchParams({
        q,
        limit: "30",
        ...(category ? { offer_type: category } : {}),
      })
      const res = await fetch(`/api/search?${params}`)
      const data = await res.json()
      setResults(data.hits ?? data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ds-background">
      {/* Hero search bar */}
      <div className="bg-gradient-to-r from-ds-primary to-indigo-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6 text-center">
            {t(locale, "search.title", "Search Everything")}
          </h1>
          <div className="flex gap-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch(query)}
              placeholder={t(
                locale,
                "search.placeholder",
                "Search products, bookings, services…",
              )}
              className="flex-1 px-5 py-3 text-base rounded-xl border-0 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
              autoFocus
            />
            <button
              onClick={() => doSearch(query)}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-colors"
            >
              {t(locale, "common.search", "Search")}
            </button>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setActiveCategory(cat.value)
                  doSearch(query, cat.value)
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat.value ? "bg-white text-ds-primary" : "bg-white/20 text-white hover:bg-white/30"}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Results */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="border border-ds-border rounded-xl h-48 animate-pulse bg-ds-muted/20"
              />
            ))}
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">
              {t(locale, "search.no_results", "No results found")}
            </h2>
            <p className="text-ds-muted-foreground">
              {t(
                locale,
                "search.no_results_hint",
                "Try different keywords or browse categories",
              )}
            </p>
            <div className="flex justify-center gap-3 mt-6 flex-wrap">
              {CATEGORIES.filter((c) => c.value).map((c) => (
                <Link
                  key={c.value}
                  to={`${prefix}/${c.value}s` as never}
                  className="px-4 py-2 border border-ds-border rounded-lg text-sm hover:bg-ds-muted/50 transition-colors"
                >
                  Browse {c.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-ds-muted-foreground">
                {results.length} results for "{query}"
              </p>
              <select className="text-sm border border-ds-border rounded-lg px-3 py-1.5 bg-ds-background">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((r: any) => (
                <Link
                  key={r.id}
                  to={`${prefix}/products/${r.handle ?? r.id}` as never}
                  className="border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-primary/40 transition-all duration-200 group"
                >
                  {r.thumbnail ? (
                    <img
                      src={r.thumbnail}
                      alt={r.title}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-ds-primary/10 to-indigo-100 flex items-center justify-center text-3xl">
                      {r.offer_type === "service"
                        ? "🛎"
                        : r.offer_type === "real_estate"
                          ? "🏡"
                          : "📦"}
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-medium text-ds-foreground text-sm line-clamp-2 mb-1">
                      {r.title}
                    </p>
                    {r.base_price && (
                      <p className="text-ds-primary font-semibold text-sm">
                        SAR {r.base_price?.toLocaleString()}
                      </p>
                    )}
                    <span className="text-xs text-ds-muted-foreground">
                      {r.offer_type ?? "product"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {!hasSearched && (
          <div className="text-center py-16 text-ds-muted-foreground">
            <p className="text-lg">
              {t(
                locale,
                "search.start_prompt",
                "Start typing to search across all verticals",
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
