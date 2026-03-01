// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/quotes/")({
  component: QuotesPage,
  head: () => ({
    meta: [
      { title: "Request a Quote | Dakkah CityOS" },
      { name: "description", content: "Request quotes on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const categories = [
        {
          id: "1",
          name: "Construction",
          description:
            "Building, renovation, and infrastructure projects of any scale.",
          icon: "🏗️",
          image: "/seed-images/b2b/1504384308090-c894fdcc538d.jpg",
          avgTime: "2-3 days",
        },
        {
          id: "2",
          name: "Catering",
          description:
            "Food services for events, corporate functions, and celebrations.",
          icon: "🍽️",
          image: "/seed-images/restaurants/1555396273-367ea4eb4db5.jpg",
          avgTime: "1-2 days",
        },
        {
          id: "3",
          name: "Events",
          description:
            "Event planning, venues, entertainment, and production services.",
          icon: "🎪",
          image: "/seed-images/events/1540575467063-178a50c2df87.jpg",
          avgTime: "1-3 days",
        },
        {
          id: "4",
          name: "IT Services",
          description:
            "Software development, cloud solutions, cybersecurity, and IT support.",
          icon: "💻",
          image: "/seed-images/digital-products/1506744038136-46273834b3fb.jpg",
          avgTime: "2-5 days",
        },
        {
          id: "5",
          name: "Marketing",
          description:
            "Digital marketing, branding, social media, and advertising campaigns.",
          icon: "📣",
          image: "/seed-images/freelance/1498050108023-c5249f4df085.jpg",
          avgTime: "1-2 days",
        },
        {
          id: "6",
          name: "Consulting",
          description:
            "Business strategy, management consulting, and professional advisory.",
          icon: "📊",
          image: "/seed-images/financial-products/1560518883-ce09059eeffa.jpg",
          avgTime: "1-3 days",
        },
      ]
      return { categories }
    } catch {
      return { categories: [] }
    }
  },
})

function QuotesPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const data = Route.useLoaderData()
  const categories = data?.categories || []

  const filtered = categories.filter((c: any) =>
    searchQuery
      ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  )

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
            <span className="text-white">{t(locale, "quotes.breadcrumb")}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t(locale, "quotes.hero_title")}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, "quotes.hero_subtitle")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{t(locale, "quotes.badge_categories")}</span>
            <span>|</span>
            <span>{t(locale, "quotes.badge_free")}</span>
            <span>|</span>
            <span>{t(locale, "verticals.verified_providers")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(locale, "quotes.search_placeholder")}
            className="w-full max-w-md px-4 py-2.5 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-warning"
          />
        </div>

        {filtered.length === 0 ? (
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
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-ds-foreground mb-2">
              {t(locale, "verticals.no_results")}
            </h3>
            <p className="text-ds-muted-foreground text-sm">
              {t(locale, "quotes.no_results_hint")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filtered.map((cat: any) => (
              <div
                key={cat.id}
                className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-warning/40 transition-all duration-200"
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img
                    loading="lazy"
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 start-3 text-3xl">
                    {cat.icon}
                  </div>
                  <div className="absolute bottom-3 start-3">
                    <span className="px-2 py-1 text-xs font-medium bg-ds-card/90 text-ds-foreground rounded-md">
                      Avg. response: {cat.avgTime}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-ds-foreground mb-2 group-hover:text-ds-warning transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-ds-muted-foreground mb-4">
                    {cat.description}
                  </p>
                  <button className="w-full py-2.5 text-sm font-medium rounded-lg bg-ds-warning text-white hover:bg-ds-warning transition-colors">
                    {t(locale, "quotes.get_quote")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
                {t(locale, "quotes.step1_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "quotes.step1_desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-warning text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "quotes.step2_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "quotes.step2_desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-warning text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "quotes.step3_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "quotes.step3_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
