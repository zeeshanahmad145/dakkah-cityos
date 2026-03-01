// @ts-nocheck
import {
  getServerBaseUrl,
  fetchWithTimeout,
  getMedusaPublishableKey,
} from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

const fallbackItems = [
  {
    id: "vd-1",
    name: "Premium Ballpoint Pens",
    category: "office",
    thumbnail: "/seed-images/volume-deals/1486406146926-c627a92ad1ab.jpg",
    description:
      "Smooth-writing metal ballpoint pens with ergonomic grip. Blue ink. Ideal for corporate gifts.",
    tiers: [
      { qty: "10+", price: 499 },
      { qty: "50+", price: 399 },
      { qty: "100+", price: 299 },
    ],
    max_savings: 40,
  },
  {
    id: "vd-2",
    name: "Reusable Shopping Bags",
    category: "retail",
    thumbnail: "/seed-images/volume-deals/1497435334941-8c899ee9e8e9.jpg",
    description:
      "Eco-friendly non-woven bags, full-color printing available. Perfect for retail promotions.",
    tiers: [
      { qty: "10+", price: 350 },
      { qty: "50+", price: 250 },
      { qty: "100+", price: 150 },
    ],
    max_savings: 57,
  },
  {
    id: "vd-3",
    name: "USB Flash Drives 32GB",
    category: "electronics",
    thumbnail: "/seed-images/volume-deals/1504674900247-0877df9cc836.jpg",
    description:
      "Compact USB 3.0 flash drives with custom logo area. Bulk pricing for events.",
    tiers: [
      { qty: "10+", price: 899 },
      { qty: "50+", price: 699 },
      { qty: "100+", price: 499 },
    ],
    max_savings: 45,
  },
  {
    id: "vd-4",
    name: "Cotton Face Towels",
    category: "hospitality",
    thumbnail: "/seed-images/volume-deals/1486406146926-c627a92ad1ab.jpg",
    description:
      "500 GSM premium cotton towels. Machine washable, quick-drying. Hotel & spa grade.",
    tiers: [
      { qty: "10+", price: 699 },
      { qty: "50+", price: 549 },
      { qty: "100+", price: 399 },
    ],
    max_savings: 43,
  },
  {
    id: "vd-5",
    name: "Corrugated Shipping Boxes",
    category: "packaging",
    thumbnail: "/seed-images/volume-deals/1497435334941-8c899ee9e8e9.jpg",
    description:
      "Heavy-duty double-wall corrugated boxes. Standard sizes available. Custom sizes on request.",
    tiers: [
      { qty: "10+", price: 299 },
      { qty: "50+", price: 199 },
      { qty: "100+", price: 129 },
    ],
    max_savings: 57,
  },
  {
    id: "vd-6",
    name: "Hand Sanitizer Bottles 250ml",
    category: "hygiene",
    thumbnail: "/seed-images/volume-deals/1504674900247-0877df9cc836.jpg",
    description:
      "70% alcohol gel sanitizer. FDA-approved. Private label available.",
    tiers: [
      { qty: "10+", price: 499 },
      { qty: "50+", price: 349 },
      { qty: "100+", price: 249 },
    ],
    max_savings: 50,
  },
]

export const Route = createFileRoute("/$tenant/$locale/volume-deals/")({
  component: VolumeDealsPage,
  head: () => ({
    meta: [
      { title: "Volume Deals | Dakkah CityOS" },
      { name: "description", content: "Browse volume deals on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/volume-deals`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: fallbackItems, count: fallbackItems.length }
      const data = await resp.json()
      const raw = data.items || data.listings || data.products || []
      return {
        items: raw.length > 0 ? raw : fallbackItems,
        count: raw.length > 0 ? data.count || raw.length : fallbackItems.length,
      }
    } catch {
      return { items: fallbackItems, count: fallbackItems.length }
    }
  },
})

const categoryOptions = [
  "all",
  "office",
  "retail",
  "electronics",
  "hospitality",
  "packaging",
  "hygiene",
] as const

function VolumeDealsPage() {
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

  const formatPrice = (price: number) => {
    if (price == null) return "$0.00"
    const amount = price >= 100 ? price / 100 : price
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary to-ds-info text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link
              to={`${prefix}` as never}
              className="hover:text-white transition-colors"
            >
              {t(locale, "common.home")}
            </Link>
            <span>/</span>
            <span className="text-white">
              {t(locale, "volume_deals.breadcrumb")}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t(locale, "volume_deals.hero_title")}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, "volume_deals.hero_subtitle")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>
              {items.length} {t(locale, "volume_deals.products_count")}
            </span>
            <span>|</span>
            <span>{t(locale, "volume_deals.badge_savings")}</span>
            <span>|</span>
            <span>{t(locale, "volume_deals.badge_tiered")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">
                  {t(locale, "volume_deals.search_label")}
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(locale, "volume_deals.search_placeholder")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">
                  {t(locale, "volume_deals.category_label")}
                </label>
                <div className="space-y-1">
                  {categoryOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setCategoryFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${categoryFilter === opt ? "bg-ds-primary text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
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
                  {t(locale, "verticals.no_results")}
                </h3>
                <p className="text-ds-muted-foreground text-sm">
                  {t(locale, "volume_deals.no_results_hint")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-primary/40 transition-all duration-200"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-ds-primary/10 to-ds-info/10 relative overflow-hidden">
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
                            className="w-16 h-16 text-ds-primary/40"
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
                      <span className="absolute top-2 start-2 px-2 py-1 text-xs font-medium bg-ds-primary text-white rounded-md capitalize">
                        {item.category}
                      </span>
                      {item.max_savings > 0 && (
                        <span className="absolute top-2 end-2 px-2 py-1 text-xs font-bold bg-ds-success text-white rounded-md">
                          Save up to {item.max_savings}%
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-ds-foreground group-hover:text-ds-primary transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-ds-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {item.tiers && (
                        <div className="mt-3 space-y-1.5">
                          <p className="text-xs font-medium text-ds-foreground">
                            {t(locale, "volume_deals.pricing_tiers")}:
                          </p>
                          {item.tiers.map((tier: any, idx: number) => (
                            <div
                              key={idx}
                              className={`flex justify-between items-center text-sm px-3 py-1.5 rounded-lg ${idx === item.tiers.length - 1 ? "bg-ds-success/10 border border-ds-success/30" : "bg-ds-muted/50"}`}
                            >
                              <span className="font-medium text-ds-foreground">
                                {tier.qty}
                              </span>
                              <span
                                className={`font-bold ${idx === item.tiers.length - 1 ? "text-ds-success" : "text-ds-foreground"}`}
                              >
                                {formatPrice(tier.price ?? 0)}/unit
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                        <span className="text-xs text-ds-success font-medium">
                          {t(locale, "volume_deals.best_value")}
                        </span>
                        <span className="px-4 py-1.5 text-xs font-semibold text-white bg-ds-primary rounded-lg group-hover:bg-ds-primary/90 transition-colors">
                          {t(locale, "volume_deals.order_bulk")}
                        </span>
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
            {t(locale, "volume_deals.how_it_works_title")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "volume_deals.step1_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "volume_deals.step1_desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "volume_deals.step2_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "volume_deals.step2_desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "volume_deals.step3_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "volume_deals.step3_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
