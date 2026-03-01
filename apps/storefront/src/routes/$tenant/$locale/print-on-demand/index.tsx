// @ts-nocheck
import {
  getServerBaseUrl,
  fetchWithTimeout,
  getMedusaPublishableKey,
} from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/print-on-demand/")({
  component: PrintOnDemandPage,
  head: () => ({
    meta: [
      { title: "Print on Demand | Dakkah CityOS" },
      {
        name: "description",
        content: "Browse print on demand products on Dakkah CityOS",
      },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/print-on-demand`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { products: [], benefits: [], count: 0 }
      const data = await resp.json()
      const raw = data.items || data.products || data.listings || []
      const products = raw.map((item: any) => {
        const meta = item.metadata || {}
        return {
          id: item.id,
          name: item.name || item.title || meta.name || "Untitled Product",
          description: item.description || meta.description || "",
          startingAt: meta.starting_at || item.starting_at || null,
          image:
            item.thumbnail ||
            item.image ||
            meta.thumbnail ||
            meta.image ||
            meta.images?.[0] ||
            null,
          price: item.price || meta.price || null,
          currency: item.currency_code || meta.currency || "SAR",
          category: item.category || meta.category || null,
        }
      })
      const benefits = data.benefits || []
      return { products, benefits, count: data.count || products.length }
    } catch {
      return { products: [], benefits: [], count: 0 }
    }
  },
})

function PrintOnDemandPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const data = Route.useLoaderData()
  const products = data?.products || []
  const benefits = data?.benefits || []

  const filtered = products.filter((p: any) =>
    searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  )

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-destructive to-fuchsia-600 text-white py-16">
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
              {t(locale, "print_on_demand.breadcrumb")}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t(locale, "print_on_demand.hero_title")}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, "print_on_demand.hero_subtitle")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{t(locale, "print_on_demand.badge_no_minimums")}</span>
            <span>|</span>
            <span>{t(locale, "print_on_demand.badge_products")}</span>
            <span>|</span>
            <span>{t(locale, "print_on_demand.badge_shipping")}</span>
          </div>
          <button className="mt-8 px-8 py-3 bg-ds-card text-ds-destructive font-semibold rounded-lg hover:bg-ds-card/90 transition-colors">
            {t(locale, "print_on_demand.start_creating")}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {benefits.map((b: any, i: number) => (
            <div
              key={i}
              className="bg-gradient-to-br from-ds-destructive/10 to-fuchsia-500/5 border border-ds-destructive/20 rounded-xl p-6 text-center"
            >
              <div className="text-3xl mb-3">{b.icon}</div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {b.title}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {b.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(locale, "print_on_demand.search_placeholder")}
            className="w-full max-w-md px-4 py-2.5 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-destructive"
          />
        </div>

        <h2 className="text-2xl font-bold text-ds-foreground mb-6">
          {t(locale, "print_on_demand.products_heading")}
        </h2>
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
                d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
              />
            </svg>
            <h3 className="text-lg font-semibold text-ds-foreground mb-2">
              {t(locale, "verticals.no_results")}
            </h3>
            <p className="text-ds-muted-foreground text-sm">
              {t(locale, "print_on_demand.no_results_hint")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filtered.map((p: any) => (
              <div
                key={p.id}
                className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-destructive/40 transition-all duration-200"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-ds-destructive/10 to-fuchsia-100">
                  {p.image ? (
                    <img
                      loading="lazy"
                      src={p.image}
                      alt={p.name}
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
                          d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
                        />
                      </svg>
                    </div>
                  )}
                  {p.startingAt && (
                    <div className="absolute bottom-3 start-3">
                      <span className="px-2 py-1 text-xs font-medium bg-ds-card/90 text-ds-foreground rounded-md">
                        From {p.startingAt}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-ds-foreground mb-2 group-hover:text-ds-destructive transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-sm text-ds-muted-foreground mb-4">
                    {p.description}
                  </p>
                  <button className="w-full py-2.5 text-sm font-medium rounded-lg bg-ds-destructive text-white hover:bg-ds-destructive transition-colors">
                    {t(locale, "print_on_demand.design_now")}
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
              <div className="w-12 h-12 rounded-full bg-ds-destructive text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "print_on_demand.step1_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "print_on_demand.step1_desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-destructive text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "print_on_demand.step2_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "print_on_demand.step2_desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-destructive text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "print_on_demand.step3_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "print_on_demand.step3_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
