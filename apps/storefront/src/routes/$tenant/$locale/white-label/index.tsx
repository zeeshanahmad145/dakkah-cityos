// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/white-label/")({
  component: WhiteLabelPage,
  head: () => ({
    meta: [
      { title: "White Label | Dakkah CityOS" },
      {
        name: "description",
        content: "Browse white label products on Dakkah CityOS",
      },
    ],
  }),
  loader: async () => {
    try {
      const packages = [
        {
          id: "1",
          name: "Starter",
          price: "999",
          period: "mo",
          description:
            "Essential white-label tools for small businesses launching their brand.",
          features: [
            "Custom domain",
            "Logo & color branding",
            "Up to 100 products",
            "Basic analytics",
            "Email support",
            "SSL certificate",
          ],
          color: "gray",
          cta: "Get Started",
        },
        {
          id: "2",
          name: "Business",
          price: "2,499",
          period: "mo",
          description:
            "Complete branding solution for growing businesses that need full customization.",
          features: [
            "Everything in Starter",
            "Up to 1,000 products",
            "Custom checkout flow",
            "Advanced analytics",
            "Priority support",
            "Custom email templates",
            "Mobile app branding",
          ],
          color: "slate",
          cta: "Start Building",
          popular: true,
        },
        {
          id: "3",
          name: "Enterprise",
          price: "Custom",
          period: "",
          description:
            "Fully tailored solution for large organizations with dedicated infrastructure.",
          features: [
            "Everything in Business",
            "Unlimited products",
            "Dedicated infrastructure",
            "Custom integrations",
            "SLA guarantee",
            "Dedicated account team",
            "API access",
            "Multi-region deployment",
          ],
          color: "dark",
          cta: "Contact Sales",
        },
      ]
      const features = [
        {
          title: "Complete Brand Control",
          description:
            "Your logo, colors, domain, and identity — no trace of our platform visible to your customers.",
          icon: "🎨",
        },
        {
          title: "Custom Storefront",
          description:
            "Fully customizable storefront with your branding, layout preferences, and design language.",
          icon: "🏪",
        },
        {
          title: "Branded Mobile App",
          description:
            "Launch your own branded mobile app on iOS and Android app stores.",
          icon: "📱",
        },
        {
          title: "Payment Integration",
          description:
            "Integrate your preferred payment gateways with your brand's checkout experience.",
          icon: "💳",
        },
        {
          title: "Custom Analytics",
          description:
            "White-labeled dashboards and reports with your branding for internal and client use.",
          icon: "📊",
        },
        {
          title: "API & Integrations",
          description:
            "Full API access to integrate with your existing systems, CRM, and ERP tools.",
          icon: "🔗",
        },
      ]
      const comparisons = [
        {
          feature: "Custom Domain",
          starter: true,
          business: true,
          enterprise: true,
        },
        {
          feature: "Brand Customization",
          starter: "Basic",
          business: "Full",
          enterprise: "Full",
        },
        {
          feature: "Product Limit",
          starter: "100",
          business: "1,000",
          enterprise: "Unlimited",
        },
        {
          feature: "Mobile App",
          starter: false,
          business: true,
          enterprise: true,
        },
        {
          feature: "API Access",
          starter: false,
          business: false,
          enterprise: true,
        },
        {
          feature: "Dedicated Infrastructure",
          starter: false,
          business: false,
          enterprise: true,
        },
        {
          feature: "SLA Guarantee",
          starter: false,
          business: false,
          enterprise: true,
        },
        {
          feature: "Support Level",
          starter: "Email",
          business: "Priority",
          enterprise: "Dedicated",
        },
      ]
      return { packages, features, comparisons }
    } catch {
      return { packages: [], features: [], comparisons: [] }
    }
  },
})

function WhiteLabelPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const data = Route.useLoaderData()
  const packages = data?.packages || []
  const features = data?.features || []
  const comparisons = data?.comparisons || []

  const filteredFeatures = features.filter((f: any) =>
    searchQuery
      ? f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  )

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
            <span className="text-white">White Label</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t(locale, "white_label.title")}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, "white_label.subtitle")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>
              {t(
                locale,
                "whiteLabel.badge_brand_control",
                "Full brand control",
              )}
            </span>
            <span>|</span>
            <span>
              {t(locale, "whiteLabel.badge_custom_domain", "Custom domain")}
            </span>
            <span>|</span>
            <span>
              {t(locale, "whiteLabel.badge_mobile_apps", "Mobile apps")}
            </span>
          </div>
          <button className="mt-8 px-8 py-3 bg-ds-card text-ds-foreground font-semibold rounded-lg hover:bg-ds-card/90 transition-colors">
            {t(locale, "white_label.schedule_demo")}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(locale, "white_label.search_placeholder")}
            className="w-full max-w-md px-4 py-2.5 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
          />
        </div>

        <h2 className="text-2xl font-bold text-ds-foreground mb-6">
          Platform Features
        </h2>
        {filteredFeatures.length === 0 ? (
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
                d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-ds-foreground mb-2">
              {t(locale, "white_label.no_results")}
            </h3>
            <p className="text-ds-muted-foreground text-sm">
              {t(locale, "verticals.try_adjusting")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredFeatures.map((f: any, i: number) => (
              <div
                key={i}
                className="bg-ds-background border border-ds-border rounded-xl p-6 hover:shadow-lg hover:border-ds-border transition-all duration-200"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-ds-foreground mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-ds-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-2xl font-bold text-ds-foreground mb-6">
          Pricing Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {packages.map((pkg: any) => (
            <div
              key={pkg.id}
              className={`relative bg-ds-background border ${pkg.popular ? "border-ds-primary ring-2 ring-ds-primary/20" : "border-ds-border"} rounded-xl p-6 hover:shadow-lg transition-all duration-200`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 start-6 px-3 py-1 text-xs font-bold bg-ds-primary text-ds-primary-foreground rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-ds-foreground mb-1">
                {pkg.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-ds-foreground">
                  {pkg.price}
                </span>
                {pkg.period && (
                  <span className="text-sm text-ds-muted-foreground">
                    SAR/{pkg.period}
                  </span>
                )}
              </div>
              <p className="text-sm text-ds-muted-foreground mb-4">
                {pkg.description}
              </p>
              <ul className="space-y-2 mb-6">
                {(pkg.features as string[]).map((f: string, i: number) => (
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
                className={`w-full py-2.5 rounded-lg font-medium transition-colors ${pkg.popular ? "bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/80" : "bg-ds-muted text-ds-foreground hover:bg-ds-muted/80"}`}
              >
                {pkg.cta}
              </button>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-ds-foreground mb-6">
          Feature Comparison
        </h2>
        <div className="bg-ds-background border border-ds-border rounded-xl overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ds-border bg-ds-muted/50">
                  <th className="text-left p-4 font-semibold text-ds-foreground">
                    Feature
                  </th>
                  <th className="text-center p-4 font-semibold text-ds-foreground">
                    Starter
                  </th>
                  <th className="text-center p-4 font-semibold text-ds-foreground">
                    Business
                  </th>
                  <th className="text-center p-4 font-semibold text-ds-foreground">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row: any, i: number) => (
                  <tr
                    key={i}
                    className="border-b border-ds-border last:border-0"
                  >
                    <td className="p-4 text-ds-foreground font-medium">
                      {row.feature}
                    </td>
                    {["starter", "business", "enterprise"].map((tier) => (
                      <td key={tier} className="p-4 text-center">
                        {row[tier] === true ? (
                          <svg
                            className="w-5 h-5 text-ds-success mx-auto"
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
                        ) : row[tier] === false ? (
                          <svg
                            className="w-5 h-5 text-ds-muted-foreground/50 mx-auto"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        ) : (
                          <span className="text-ds-muted-foreground">
                            {row[tier]}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <section className="py-16 bg-ds-card border-t border-ds-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">
            {t(locale, "verticals.how_it_works")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-ds-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Choose Your Plan
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Select the package that matches your business needs and scale.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-ds-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Customize & Brand
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Apply your brand identity, configure features, and connect your
                domain.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-ds-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Launch & Grow
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Go live with your branded marketplace and start growing your
                business.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
