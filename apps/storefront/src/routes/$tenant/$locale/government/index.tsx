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
    id: "gov-1",
    name: "Business License",
    department: "municipal",
    description:
      "Register and obtain a license to operate your business within the municipality. Required for all commercial activities.",
    icon: "briefcase",
    required_documents: [
      "ID/Passport copy",
      "Commercial registration",
      "Lease agreement",
      "Tax registration certificate",
    ],
    processing_time: "5-7 business days",
    fee: 25000,
  },
  {
    id: "gov-2",
    name: "Building Permit",
    department: "municipal",
    description:
      "Apply for construction or renovation permits for residential and commercial properties.",
    icon: "building",
    required_documents: [
      "Architectural plans",
      "Land ownership deed",
      "Engineering drawings",
      "Environmental impact assessment",
    ],
    processing_time: "15-30 business days",
    fee: 50000,
  },
  {
    id: "gov-3",
    name: "Event Permit",
    department: "municipal",
    description:
      "Obtain permission for public events, gatherings, exhibitions, and festivals within city limits.",
    icon: "calendar",
    required_documents: [
      "Event proposal",
      "Security plan",
      "Insurance certificate",
      "Venue approval letter",
    ],
    processing_time: "10-14 business days",
    fee: 15000,
  },
  {
    id: "gov-4",
    name: "Trade License",
    department: "trade",
    description:
      "Import/export license for businesses engaged in international trade and commerce activities.",
    icon: "globe",
    required_documents: [
      "Business license",
      "Trade registration",
      "Bank guarantee",
      "Customs broker authorization",
    ],
    processing_time: "7-10 business days",
    fee: 35000,
  },
  {
    id: "gov-5",
    name: "Health Certificate",
    department: "health",
    description:
      "Health and safety certification required for food establishments, healthcare facilities, and wellness centers.",
    icon: "heart",
    required_documents: [
      "Facility inspection report",
      "Staff health records",
      "Food safety plan",
      "Waste management protocol",
    ],
    processing_time: "10-15 business days",
    fee: 20000,
  },
  {
    id: "gov-6",
    name: "Environmental Clearance",
    department: "environment",
    description:
      "Environmental impact clearance for construction projects, industrial operations, and land development.",
    icon: "leaf",
    required_documents: [
      "Environmental impact study",
      "Pollution control plan",
      "Waste treatment proposal",
      "Community consultation report",
    ],
    processing_time: "20-45 business days",
    fee: 75000,
  },
]

const iconMap: Record<string, JSX.Element> = {
  briefcase: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  ),
  building: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  ),
  calendar: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  ),
  globe: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  heart: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  ),
  leaf: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  ),
}

export const Route = createFileRoute("/$tenant/$locale/government/")({
  component: GovernmentPage,
  head: () => ({
    meta: [
      { title: "Government Services | Dakkah CityOS" },
      {
        name: "description",
        content: "Browse government services on Dakkah CityOS",
      },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/government`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: fallbackItems, count: fallbackItems.length }
      const data = await resp.json()
      const raw = data.items || data.services || data.listings || []
      return {
        items: raw.length > 0 ? raw : fallbackItems,
        count: raw.length > 0 ? data.count || raw.length : fallbackItems.length,
      }
    } catch {
      return { items: fallbackItems, count: fallbackItems.length }
    }
  },
})

const departmentOptions = [
  "all",
  "municipal",
  "trade",
  "health",
  "environment",
] as const

function GovernmentPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      : true
    const matchesDept =
      departmentFilter === "all" || item.department === departmentFilter
    return matchesSearch && matchesDept
  })

  const formatFee = (fee: number) => {
    if (!fee) return "Free"
    const amount = fee >= 100 ? fee / 100 : fee
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  }

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
            <span className="text-white">
              {t(locale, "government.breadcrumb")}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t(locale, "government.hero_title")}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, "government.hero_subtitle")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>
              {items.length} {t(locale, "government.services_available")}
            </span>
            <span>|</span>
            <span>{t(locale, "government.badge_online")}</span>
            <span>|</span>
            <span>{t(locale, "government.badge_tracking")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">
                  {t(locale, "government.search_label")}
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(locale, "government.search_placeholder")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">
                  {t(locale, "government.department_label")}
                </label>
                <div className="space-y-1">
                  {departmentOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setDepartmentFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${departmentFilter === opt ? "bg-ds-primary text-ds-primary-foreground" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all"
                        ? t(locale, "verticals.all_departments")
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">
                  {t(locale, "verticals.no_results")}
                </h3>
                <p className="text-ds-muted-foreground text-sm">
                  {t(locale, "government.no_results_hint")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-muted-foreground transition-all duration-200 p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-ds-muted flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-ds-muted-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          {iconMap[item.icon] || iconMap.briefcase}
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-ds-foreground group-hover:text-ds-muted-foreground transition-colors line-clamp-1">
                          {item.name}
                        </h3>
                        <span className="text-xs text-ds-muted-foreground capitalize">
                          {item.department} Department
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-ds-muted-foreground line-clamp-2 mb-4">
                      {item.description}
                    </p>

                    {item.required_documents && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-ds-foreground mb-1.5">
                          {t(locale, "government.required_documents")}:
                        </p>
                        <ul className="space-y-1">
                          {item.required_documents
                            .slice(0, 3)
                            .map((doc: string, idx: number) => (
                              <li
                                key={idx}
                                className="text-xs text-ds-muted-foreground flex items-center gap-1.5"
                              >
                                <svg
                                  className="w-3 h-3 text-ds-muted-foreground flex-shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4"
                                  />
                                </svg>
                                {doc}
                              </li>
                            ))}
                          {item.required_documents.length > 3 && (
                            <li className="text-xs text-ds-muted-foreground">
                              +{item.required_documents.length - 3} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-2 text-sm mb-4">
                      {item.processing_time && (
                        <div className="flex justify-between">
                          <span className="text-ds-muted-foreground flex items-center gap-1">
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
                            {t(locale, "government.processing")}
                          </span>
                          <span className="font-medium text-ds-foreground">
                            {item.processing_time}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-ds-muted-foreground">
                          {t(locale, "government.fee")}
                        </span>
                        <span className="font-bold text-ds-foreground">
                          {formatFee(item.fee)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-ds-border">
                      <span className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold text-ds-primary-foreground bg-ds-primary rounded-lg group-hover:bg-ds-primary/80 transition-colors w-full justify-center">
                        {t(locale, "government.apply_now")}
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </span>
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
            {t(locale, "government.application_process")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-ds-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "government.step1_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "government.step1_desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-ds-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "government.step2_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "government.step2_desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-ds-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "government.step3_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "government.step3_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
