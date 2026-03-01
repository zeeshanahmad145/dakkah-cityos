// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/credit/")({
  component: CreditPage,
  head: () => ({
    meta: [
      { title: "Credit | Dakkah CityOS" },
      {
        name: "description",
        content: "Browse credit options on Dakkah CityOS",
      },
    ],
  }),
  loader: async () => {
    try {
      const plans = [
        {
          id: "1",
          name: "Basic Credit",
          limit: 5000,
          apr: 0,
          term: "6 months",
          monthly: 833,
          description:
            "Perfect for small purchases with 0% interest for 6 months.",
          features: [
            "0% APR intro rate",
            "Up to 5,000 SAR",
            "No annual fee",
            "Online management",
          ],
          color: "blue",
          popular: false,
        },
        {
          id: "2",
          name: "Standard Credit",
          limit: 15000,
          apr: 4.9,
          term: "12 months",
          monthly: 1250,
          description:
            "Flexible credit for medium-sized purchases with competitive rates.",
          features: [
            "4.9% APR",
            "Up to 15,000 SAR",
            "Rewards points",
            "Free balance transfers",
          ],
          color: "indigo",
          popular: true,
        },
        {
          id: "3",
          name: "Premium Credit",
          limit: 50000,
          apr: 3.5,
          term: "24 months",
          monthly: 2083,
          description:
            "Higher limits for big purchases with premium benefits and lower rates.",
          features: [
            "3.5% APR",
            "Up to 50,000 SAR",
            "Priority support",
            "Travel insurance included",
          ],
          color: "purple",
          popular: false,
        },
        {
          id: "4",
          name: "Business Credit",
          limit: 100000,
          apr: 2.9,
          term: "36 months",
          monthly: 2778,
          description:
            "Enterprise-grade credit line for business procurement and operations.",
          features: [
            "2.9% APR",
            "Up to 100,000 SAR",
            "Dedicated account manager",
            "Custom payment schedules",
          ],
          color: "slate",
          popular: false,
        },
      ]
      return {
        plans,
        availableCredit: 12500,
        usedCredit: 2500,
        currency: "SAR",
      }
    } catch {
      return { plans: [], availableCredit: 0, usedCredit: 0, currency: "SAR" }
    }
  },
})

function CreditPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const data = Route.useLoaderData()
  const plans = data?.plans || []

  const filteredPlans = plans.filter((p: any) =>
    searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  )

  const colorMap: Record<string, string> = {
    blue: "from-ds-primary to-ds-primary",
    indigo: "from-ds-primary to-ds-primary",
    purple: "from-ds-primary to-ds-primary",
    slate: "from-ds-muted-foreground to-ds-primary",
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary to-ds-primary/90 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link
              to={`${prefix}` as never}
              className="hover:text-white transition-colors"
            >
              {t(locale, "common.home")}
            </Link>
            <span>/</span>
            <span className="text-white">{t(locale, "credit.breadcrumb")}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t(locale, "credit.hero_title")}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, "credit.hero_subtitle")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{t(locale, "credit.badge_apr")}</span>
            <span>|</span>
            <span>{t(locale, "credit.badge_approval")}</span>
            <span>|</span>
            <span>{t(locale, "credit.badge_fees")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-ds-primary/10 to-ds-primary/5 border border-ds-info/20 rounded-xl p-6">
            <p className="text-sm font-medium text-ds-muted-foreground mb-1">
              {t(locale, "credit.available_credit")}
            </p>
            <p className="text-3xl font-bold text-ds-foreground">
              {(data?.availableCredit || 0).toLocaleString()} SAR
            </p>
          </div>
          <div className="bg-gradient-to-br from-ds-primary/10 to-ds-primary/5 border border-ds-primary/20 rounded-xl p-6">
            <p className="text-sm font-medium text-ds-muted-foreground mb-1">
              {t(locale, "credit.used_credit")}
            </p>
            <p className="text-3xl font-bold text-ds-foreground">
              {(data?.usedCredit || 0).toLocaleString()} SAR
            </p>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(locale, "credit.search_placeholder")}
            className="w-full max-w-md px-4 py-2.5 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-primary"
          />
        </div>

        <h2 className="text-2xl font-bold text-ds-foreground mb-6">
          {t(locale, "credit.credit_plans")}
        </h2>
        {filteredPlans.length === 0 ? (
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
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-ds-foreground mb-2">
              {t(locale, "verticals.no_results")}
            </h3>
            <p className="text-ds-muted-foreground text-sm">
              {t(locale, "credit.no_results_hint")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {filteredPlans.map((plan: any) => (
              <div
                key={plan.id}
                className={`relative bg-ds-background border ${plan.popular ? "border-ds-info ring-2 ring-ds-primary/20" : "border-ds-border"} rounded-xl p-6 hover:shadow-lg transition-all duration-200`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 start-6 px-3 py-1 text-xs font-bold bg-ds-primary text-white rounded-full">
                    {t(locale, "credit.most_popular")}
                  </span>
                )}
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorMap[plan.color]} flex items-center justify-center mb-4`}
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-ds-foreground mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-ds-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-ds-primary">
                    {plan.limit.toLocaleString()}
                  </span>
                  <span className="text-sm text-ds-muted-foreground">
                    SAR limit
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-ds-muted-foreground mb-4">
                  <span>{plan.apr}% APR</span>
                  <span>•</span>
                  <span>{plan.term}</span>
                  <span>•</span>
                  <span>~{plan.monthly.toLocaleString()} SAR/mo</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {(plan.features as string[]).map((f: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-ds-foreground"
                    >
                      <svg
                        className="w-4 h-4 text-ds-success flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${plan.popular ? "bg-ds-primary text-white hover:bg-ds-primary/90" : "bg-ds-muted text-ds-foreground hover:bg-ds-muted/80"}`}
                >
                  {t(locale, "credit.apply_now")}
                </button>
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
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "credit.step1_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "credit.step1_desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "credit.step2_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "credit.step2_desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                {t(locale, "credit.step3_title")}
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                {t(locale, "credit.step3_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
