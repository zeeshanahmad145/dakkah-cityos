// @ts-nocheck
import { t } from "@/lib/i18n"
import {
  getServerBaseUrl,
  fetchWithTimeout,
  getMedusaPublishableKey,
} from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

const fallbackItems = [
  {
    id: "b2b-1",
    company_name: "TechVision Solutions",
    industry: "technology",
    thumbnail: "/seed-images/b2b/1497435334941-8c899ee9e8e9.jpg",
    description:
      "Enterprise software solutions, cloud infrastructure, and IT consulting for businesses of all sizes.",
    location: "San Francisco, CA",
    established: 2012,
    employees: 450,
    products_services: [
      "Cloud hosting",
      "SaaS platforms",
      "IT consulting",
      "Cybersecurity",
    ],
  },
  {
    id: "b2b-2",
    company_name: "BuildPro Construction",
    industry: "construction",
    thumbnail: "/seed-images/b2b/1504384308090-c894fdcc538d.jpg",
    description:
      "Commercial and residential construction, project management, and architectural design services.",
    location: "Chicago, IL",
    established: 1998,
    employees: 1200,
    products_services: [
      "Commercial building",
      "Renovation",
      "Project management",
      "Green construction",
    ],
  },
  {
    id: "b2b-3",
    company_name: "Grandview Hospitality",
    industry: "hospitality",
    thumbnail: "/seed-images/b2b/1486406146926-c627a92ad1ab.jpg",
    description:
      "Premium hotel management, event catering, and hospitality training programs.",
    location: "Miami, FL",
    established: 2005,
    employees: 800,
    products_services: [
      "Hotel management",
      "Event catering",
      "Staff training",
      "Restaurant consulting",
    ],
  },
  {
    id: "b2b-4",
    company_name: "FreshSource Foods",
    industry: "food",
    thumbnail: "/seed-images/b2b/1606787366850-de6330128bfc.jpg",
    description:
      "Wholesale organic food distribution, cold chain logistics, and private label food manufacturing.",
    location: "Portland, OR",
    established: 2010,
    employees: 350,
    products_services: [
      "Organic wholesale",
      "Cold chain logistics",
      "Private label",
      "Food safety consulting",
    ],
  },
  {
    id: "b2b-5",
    company_name: "MedEquip International",
    industry: "medical",
    thumbnail: "/seed-images/b2b/1519494026892-80bbd2d6fd0d.jpg",
    description:
      "Medical equipment manufacturing, hospital supply chain, and healthcare technology solutions.",
    location: "Boston, MA",
    established: 2001,
    employees: 600,
    products_services: [
      "Medical devices",
      "Hospital supplies",
      "Telemedicine",
      "Lab equipment",
    ],
  },
  {
    id: "b2b-6",
    company_name: "DataStream Analytics",
    industry: "technology",
    thumbnail: "/seed-images/b2b/1551288049-bebda4e38f71.jpg",
    description:
      "Big data analytics, business intelligence dashboards, and AI-powered predictive modeling.",
    location: "Austin, TX",
    established: 2015,
    employees: 180,
    products_services: [
      "Data analytics",
      "BI dashboards",
      "AI/ML solutions",
      "Data warehousing",
    ],
  },
]

export const Route = createFileRoute("/$tenant/$locale/b2b/")({
  component: B2BMarketplacePage,
  head: () => ({
    meta: [
      { title: "B2B Marketplace | Dakkah CityOS" },
      {
        name: "description",
        content: "Browse B2B products and services on Dakkah CityOS",
      },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/b2b`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: fallbackItems, count: fallbackItems.length }
      const data = await resp.json()
      const raw =
        data.items || data.companies || data.suppliers || data.listings || []
      return {
        items: raw.length > 0 ? raw : fallbackItems,
        count: raw.length > 0 ? data.count || raw.length : fallbackItems.length,
      }
    } catch {
      return { items: fallbackItems, count: fallbackItems.length }
    }
  },
})

const industryOptions = [
  "all",
  "technology",
  "construction",
  "hospitality",
  "food",
  "medical",
] as const

function B2BMarketplacePage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [industryFilter, setIndustryFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.company_name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      : true
    const matchesIndustry =
      industryFilter === "all" || item.industry === industryFilter
    return matchesSearch && matchesIndustry
  })

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary to-ds-primary/80 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link
              to={`${prefix}` as never}
              className="hover:text-white transition-colors"
            >
              {t(locale, "common.home")}
            </Link>
            <span>/</span>
            <span className="text-white">B2B Marketplace</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t(locale, "b2b.title")}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Connect with verified business partners, suppliers, and service
            providers across industries.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} companies</span>
            <span>|</span>
            <span>{t(locale, "verticals.verified_providers")}</span>
            <span>|</span>
            <span>{t(locale, "b2b.contact_supplier")}</span>
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
                  placeholder={t(locale, "b2b.search_placeholder")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">
                  {t(locale, "verticals.industry_label")}
                </label>
                <div className="space-y-1">
                  {industryOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setIndustryFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${industryFilter === opt ? "bg-ds-primary text-ds-primary-foreground" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all"
                        ? t(locale, "verticals.all_industries")
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
                    d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">
                  {t(locale, "b2b.no_results")}
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
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-muted-foreground transition-all duration-200"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-ds-background to-ds-muted relative overflow-hidden">
                      {item.thumbnail ? (
                        <img
                          loading="lazy"
                          src={item.thumbnail}
                          alt={item.company_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-16 h-16 text-ds-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21"
                            />
                          </svg>
                        </div>
                      )}
                      {item.industry && (
                        <span className="absolute top-2 start-2 px-2 py-1 text-xs font-medium bg-ds-primary text-ds-primary-foreground rounded-md capitalize">
                          {item.industry}
                        </span>
                      )}
                      {item.established && (
                        <span className="absolute top-2 end-2 px-2 py-1 text-xs font-medium bg-ds-card/90 text-ds-foreground/80 rounded-md">
                          Est. {item.established}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-ds-foreground group-hover:text-ds-muted-foreground transition-colors line-clamp-1">
                        {item.company_name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-ds-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="space-y-2 mt-3 text-sm">
                        {item.location && (
                          <div className="flex items-center gap-1.5 text-ds-muted-foreground">
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
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span>{item.location}</span>
                          </div>
                        )}
                        {item.employees && (
                          <div className="flex items-center gap-1.5 text-ds-muted-foreground">
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
                            <span>
                              {item.employees.toLocaleString()} employees
                            </span>
                          </div>
                        )}
                      </div>

                      {item.products_services && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-1.5">
                            {item.products_services
                              .slice(0, 3)
                              .map((svc: string) => (
                                <span
                                  key={svc}
                                  className="px-2 py-0.5 bg-ds-muted text-ds-foreground rounded text-xs font-medium"
                                >
                                  {svc}
                                </span>
                              ))}
                            {item.products_services.length > 3 && (
                              <span className="px-2 py-0.5 bg-ds-muted text-ds-muted-foreground rounded text-xs">
                                +{item.products_services.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                        <span className="text-xs text-ds-muted-foreground">
                          Verified partner
                        </span>
                        <span className="px-4 py-1.5 text-xs font-semibold text-ds-primary-foreground bg-ds-primary rounded-lg group-hover:bg-ds-primary/80 transition-colors">
                          {t(locale, "b2b.contact_supplier")}
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
            Partner With Us
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-ds-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Browse Partners
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Explore verified companies across multiple industries.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-ds-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Connect Directly
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Reach out to suppliers and start business discussions.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-ds-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Grow Together
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Build lasting partnerships that drive mutual growth.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
