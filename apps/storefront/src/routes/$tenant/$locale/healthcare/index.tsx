// @ts-nocheck
import {
  getServerBaseUrl,
  fetchWithTimeout,
  getMedusaPublishableKey,
} from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/healthcare/")({
  component: HealthcarePage,
  head: () => ({
    meta: [
      { title: "Healthcare | Dakkah CityOS" },
      {
        name: "description",
        content: "Browse healthcare services on Dakkah CityOS",
      },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/healthcare`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: [], count: 0 }
      const data = await resp.json()
      const raw =
        data.items || data.listings || data.products || data.services || []
      const items = raw.map((item: any) => {
        const meta = item.metadata || {}
        return {
          id: item.id,
          name: item.name || meta.name || "Doctor",
          title: item.title || meta.title || null,
          specialization: item.specialization || meta.specialization || null,
          bio: item.bio || meta.bio || "",
          education:
            typeof (item.education || meta.education) === "string"
              ? item.education || meta.education
              : Array.isArray(item.education || meta.education)
                ? (item.education || meta.education)
                    .map((e: any) =>
                      typeof e === "string"
                        ? e
                        : e.degree || e.institution || "",
                    )
                    .join(", ")
                : null,
          experience_years: item.experience_years || meta.experience_years || 0,
          languages: item.languages || meta.languages || [],
          thumbnail:
            item.thumbnail || meta.thumbnail || meta.images?.[0] || null,
          images: meta.images || [],
          rating: meta.rating || item.rating || null,
          consultation_fee:
            meta.consultation_fee || item.consultation_fee || null,
          currency_code: item.currency_code || meta.currency_code || "USD",
          location: item.location || meta.location || null,
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const specOptions = [
  "all",
  "general",
  "cardiology",
  "dermatology",
  "pediatrics",
  "orthopedics",
  "psychiatry",
  "dentistry",
] as const

function HealthcarePage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [specFilter, setSpecFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.specialization || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.bio || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesSpec =
      specFilter === "all" || item.specialization === specFilter
    return matchesSearch && matchesSpec
  })

  const formatFee = (fee: number | null, currency: string) => {
    if (!fee) return t(locale, "verticals.contact_pricing")
    const amount = fee >= 100 ? fee / 100 : fee
    return `${amount.toLocaleString()} ${currency.toUpperCase()}`
  }

  const specIcon = (spec: string) => {
    const map: Record<string, string> = {
      general: "🩺",
      cardiology: "❤️",
      dermatology: "🧴",
      pediatrics: "👶",
      orthopedics: "🦴",
      psychiatry: "🧠",
      dentistry: "🦷",
    }
    return map[spec] || "🏥"
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
            <span className="text-white">Healthcare</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t(locale, "healthcare.title")}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, "healthcare.hero_subtitle")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} providers</span>
            <span>|</span>
            <span>{t(locale, "verticals.verified_providers")}</span>
            <span>|</span>
            <span>{t(locale, "verticals.instant_booking")}</span>
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
                  placeholder={t(locale, "healthcare.search_placeholder")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">
                  {t(locale, "verticals.specialization_label")}
                </label>
                <div className="space-y-1">
                  {specOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSpecFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${specFilter === opt ? "bg-ds-primary text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all"
                        ? t(locale, "verticals.all_specializations")
                        : `${specIcon(opt)} ${opt.charAt(0).toUpperCase() + opt.slice(1)}`}
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
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">
                  {t(locale, "healthcare.no_results")}
                </h3>
                <p className="text-ds-muted-foreground text-sm">
                  {t(locale, "verticals.try_adjusting")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => {
                  const langs = Array.isArray(item.languages)
                    ? item.languages
                    : item.languages
                      ? [item.languages]
                      : []
                  return (
                    <a
                      key={item.id}
                      href={`${prefix}/healthcare/${item.id}`}
                      className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-primary/40 transition-all duration-200 p-5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ds-primary/15 to-ds-info/30 overflow-hidden flex-shrink-0">
                          {item.thumbnail ? (
                            <img
                              loading="lazy"
                              src={item.thumbnail}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-ds-primary text-xl font-bold">
                              {(item.name || "D").charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-ds-foreground group-hover:text-ds-primary transition-colors line-clamp-1">
                            Dr. {item.name}
                          </h3>
                          {item.title && (
                            <p className="text-xs text-ds-muted-foreground">
                              {item.title}
                            </p>
                          )}
                          {item.specialization && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-ds-info/15 text-ds-info rounded-md capitalize">
                              {specIcon(item.specialization)}{" "}
                              {item.specialization}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.bio && (
                        <p className="text-sm text-ds-muted-foreground mt-3 line-clamp-2">
                          {item.bio}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-3 text-xs text-ds-muted-foreground flex-wrap">
                        {item.experience_years > 0 && (
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {item.experience_years}+ years
                          </span>
                        )}
                        {item.education && (
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
                                d="M12 14l9-5-9-5-9 5 9 5z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                              />
                            </svg>
                            <span className="truncate max-w-[120px]">
                              {item.education}
                            </span>
                          </span>
                        )}
                      </div>

                      {langs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {langs.slice(0, 3).map((lang: string) => (
                            <span
                              key={lang}
                              className="px-2 py-0.5 text-xs bg-ds-info/10 text-ds-info rounded-md"
                            >
                              {lang}
                            </span>
                          ))}
                          {langs.length > 3 && (
                            <span className="px-2 py-0.5 text-xs bg-ds-info/10 text-ds-info rounded-md">
                              +{langs.length - 3}
                            </span>
                          )}
                        </div>
                      )}

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
                        <span className="font-bold text-ds-primary text-lg">
                          {formatFee(item.consultation_fee, item.currency_code)}
                        </span>
                        <span className="px-3 py-1.5 text-xs font-semibold text-white bg-ds-primary rounded-lg group-hover:bg-ds-primary/90 transition-colors">
                          {t(locale, "healthcare.book_appointment")}
                        </span>
                      </div>
                    </a>
                  )
                })}
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
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Find a Doctor
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Search by specialization, experience, and patient reviews.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Book Appointment
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Choose a convenient date and time for your consultation.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Get Care
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Visit your doctor in-person or connect via telehealth.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
