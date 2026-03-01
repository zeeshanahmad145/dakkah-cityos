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
    id: "gc-1",
    name: "Birthday Celebration",
    theme: "birthday",
    thumbnail: "/seed-images/gift-cards/1558636508-e0db3814bd1d.jpg",
    denominations: [25, 50, 100, 200],
    message_preview: "Wishing you a wonderful birthday filled with joy!",
    description:
      "Colorful birthday-themed gift card with balloons and confetti design",
  },
  {
    id: "gc-2",
    name: "Wedding Wishes",
    theme: "wedding",
    thumbnail: "/seed-images/gift-cards/1519741497674-611481863552.jpg",
    denominations: [50, 100, 250, 500],
    message_preview: "Congratulations on your special day!",
    description: "Elegant wedding gift card with floral accents",
  },
  {
    id: "gc-3",
    name: "Holiday Cheer",
    theme: "holiday",
    thumbnail: "/seed-images/gift-cards/1559056199-641a0ac8b55e.jpg",
    denominations: [25, 50, 100],
    message_preview: "Happy Holidays! Enjoy this gift from the heart.",
    description: "Festive holiday design with snowflakes and warm colors",
  },
  {
    id: "gc-4",
    name: "Thank You",
    theme: "thank_you",
    thumbnail: "/seed-images/gift-cards/1606293926075-69a00dbfde81.jpg",
    denominations: [10, 25, 50, 100],
    message_preview: "Thank you for being amazing!",
    description: "Heartfelt thank you card with elegant typography",
  },
  {
    id: "gc-5",
    name: "Graduation Achievement",
    theme: "graduate",
    thumbnail: "/seed-images/gift-cards/1602028915047-37269d1a73f7.jpg",
    denominations: [50, 100, 200, 500],
    message_preview: "Congratulations, Graduate! The future is yours!",
    description: "Graduation-themed card celebrating academic achievement",
  },
  {
    id: "gc-6",
    name: "Just Because",
    theme: "holiday",
    thumbnail: "/seed-images/gift-cards/1559056199-641a0ac8b55e.jpg",
    denominations: [10, 25, 50],
    message_preview: "Just because you deserve something special!",
    description: "Versatile gift card for any occasion",
  },
]

export const Route = createFileRoute("/$tenant/$locale/gift-cards-shop/")({
  component: GiftCardsShopPage,
  head: () => ({
    meta: [
      { title: "Gift Cards | Dakkah CityOS" },
      { name: "description", content: "Browse gift cards on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/gift-cards`, {
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

const themeOptions = [
  "all",
  "birthday",
  "wedding",
  "holiday",
  "thank_you",
  "graduate",
] as const

function GiftCardsShopPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [themeFilter, setThemeFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      : true
    const matchesTheme = themeFilter === "all" || item.theme === themeFilter
    return matchesSearch && matchesTheme
  })

  const themeLabel = (t: string) => {
    const labels: Record<string, string> = {
      birthday: "Birthday",
      wedding: "Wedding",
      holiday: "Holiday",
      thank_you: "Thank You",
      graduate: "Graduation",
    }
    return labels[t] || t.charAt(0).toUpperCase() + t.slice(1)
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-destructive to-ds-primary text-white py-16">
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
              {t(locale, "gift_cards.breadcrumb")}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t(locale, "gift_cards.hero_title")}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, "gift_cards.hero_subtitle")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>
              {items.length} {t(locale, "gift_cards.designs_available")}
            </span>
            <span>|</span>
            <span>{t(locale, "gift_cards.badge_instant")}</span>
            <span>|</span>
            <span>{t(locale, "gift_cards.badge_custom")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">
                  {t(locale, "gift_cards.search_label")}
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(locale, "gift_cards.search_placeholder")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">
                  {t(locale, "gift_cards.theme_label")}
                </label>
                <div className="space-y-1">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setThemeFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${themeFilter === opt ? "bg-ds-destructive text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all"
                        ? t(locale, "verticals.all_themes")
                        : themeLabel(opt)}
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
                    d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">
                  {t(locale, "verticals.no_results")}
                </h3>
                <p className="text-ds-muted-foreground text-sm">
                  {t(locale, "gift_cards.no_results_hint")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-destructive/40 transition-all duration-200"
                  >
                    <div className="aspect-[16/10] bg-gradient-to-br from-ds-destructive/10 to-ds-primary/10 relative overflow-hidden">
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
                            className="w-16 h-16 text-ds-destructive/40"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                            />
                          </svg>
                        </div>
                      )}
                      {item.theme && (
                        <span className="absolute top-2 start-2 px-2 py-1 text-xs font-medium bg-ds-destructive text-white rounded-md">
                          {themeLabel(item.theme)}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-ds-foreground group-hover:text-ds-destructive transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-ds-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {item.denominations && (
                        <div className="mt-3">
                          <p className="text-xs text-ds-muted-foreground mb-1.5">
                            {t(locale, "gift_cards.available_denominations")}:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {item.denominations.map((d: number) => (
                              <span
                                key={d}
                                className="px-2.5 py-1 bg-ds-primary/10 text-ds-primary rounded-md text-xs font-semibold"
                              >
                                ${d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.message_preview && (
                        <div className="mt-3 p-2 bg-ds-muted/50 rounded-lg">
                          <p className="text-xs text-ds-muted-foreground italic">
                            "{item.message_preview}"
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                        <span className="font-bold text-ds-destructive text-lg">
                          From ${item.denominations?.[0] || 10}
                        </span>
                        <span className="px-4 py-1.5 text-xs font-semibold text-white bg-ds-destructive rounded-lg group-hover:bg-ds-destructive/90 transition-colors">
                          {t(locale, "gift_cards.buy_gift_card")}
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
            {t(locale, "verticals.how_it_works")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-destructive text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "gift_cards.step1_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "gift_cards.step1_desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-destructive text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "gift_cards.step2_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "gift_cards.step2_desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-destructive text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "gift_cards.step3_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "gift_cards.step3_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
