// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/dropshipping/")({
  component: DropshippingPage,
  head: () => ({
    meta: [
      { title: "Dropshipping | Dakkah CityOS" },
      { name: "description", content: "Browse dropshipping products on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const features = [
        { id: "1", title: "No Inventory Needed", description: "Sell products without stocking them. We handle warehousing and fulfillment for you.", icon: "📦", color: "violet" },
        { id: "2", title: "Global Supplier Network", description: "Access 500+ verified suppliers across electronics, fashion, home goods, and more.", icon: "🌐", color: "purple" },
        { id: "3", title: "Automated Fulfillment", description: "Orders are automatically routed to suppliers for fast processing and shipping.", icon: "⚡", color: "blue" },
        { id: "4", title: "Brand Customization", description: "Add your branding to packaging, invoices, and shipping labels for a professional look.", icon: "🎨", color: "pink" },
        { id: "5", title: "Real-Time Analytics", description: "Track sales, profits, and inventory levels with comprehensive dashboards.", icon: "📊", color: "green" },
        { id: "6", title: "24/7 Support", description: "Dedicated support team to help with orders, returns, and supplier issues.", icon: "🛟", color: "amber" },
      ]
      const stats = [
        { label: "Active Dropshippers", value: "5,000+" },
        { label: "Verified Suppliers", value: "500+" },
        { label: "Products Available", value: "50,000+" },
        { label: "Countries Shipped", value: "30+" },
      ]
      const plans = [
        { name: "Starter", price: "Free", features: ["Up to 50 products", "Basic analytics", "Standard shipping", "Email support"], cta: "Start Free" },
        { name: "Growth", price: "199 SAR/mo", features: ["Up to 500 products", "Advanced analytics", "Express shipping", "Priority support", "Custom branding"], cta: "Start Growing", popular: true },
        { name: "Enterprise", price: "499 SAR/mo", features: ["Unlimited products", "Premium analytics", "Same-day shipping", "Dedicated manager", "API access", "White-label"], cta: "Contact Sales" },
      ]
      return { features, stats, plans }
    } catch {
      return { features: [], stats: [], plans: [] }
    }
  },
})

function DropshippingPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const data = Route.useLoaderData()
  const features = data?.features || []
  const stats = data?.stats || []
  const plans = data?.plans || []

  const filtered = features.filter((f: any) =>
    searchQuery ? f.title.toLowerCase().includes(searchQuery.toLowerCase()) || f.description.toLowerCase().includes(searchQuery.toLowerCase()) : true
  )

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary to-ds-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">{t(locale, 'dropshipping.breadcrumb')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'dropshipping.hero_title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">{t(locale, 'dropshipping.hero_subtitle')}</p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{t(locale, 'dropshipping.badge_no_cost')}</span><span>|</span><span>{t(locale, 'dropshipping.badge_suppliers')}</span><span>|</span><span>{t(locale, 'dropshipping.badge_fulfillment')}</span>
          </div>
          <button className="mt-8 px-8 py-3 bg-ds-card text-ds-primary font-semibold rounded-lg hover:bg-ds-card/90 transition-colors">{t(locale, 'dropshipping.get_started')}</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s: any, i: number) => (
            <div key={i} className="bg-gradient-to-br from-ds-primary/10 to-ds-primary/5 border border-ds-primary/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-ds-foreground">{s.value}</p>
              <p className="text-xs text-ds-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t(locale, 'dropshipping.search_placeholder')} className="w-full max-w-md px-4 py-2.5 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-primary" />
        </div>

        <h2 className="text-2xl font-bold text-ds-foreground mb-6">{t(locale, 'dropshipping.why_dropship')}</h2>
        {filtered.length === 0 ? (
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'verticals.no_results')}</h3>
            <p className="text-ds-muted-foreground text-sm">{t(locale, 'dropshipping.no_results_hint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filtered.map((f: any) => (
              <div key={f.id} className="bg-ds-background border border-ds-border rounded-xl p-6 hover:shadow-lg hover:border-ds-primary/50 transition-all duration-200">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-ds-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-ds-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-2xl font-bold text-ds-foreground mb-6">{t(locale, 'dropshipping.pricing_plans')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan: any, i: number) => (
            <div key={i} className={`relative bg-ds-background border ${plan.popular ? "border-ds-primary ring-2 ring-ds-primary/20" : "border-ds-border"} rounded-xl p-6 hover:shadow-lg transition-all duration-200`}>
              {plan.popular && <span className="absolute -top-3 start-6 px-3 py-1 text-xs font-bold bg-ds-primary text-white rounded-full">{t(locale, 'dropshipping.most_popular')}</span>}
              <h3 className="text-xl font-bold text-ds-foreground mb-1">{plan.name}</h3>
              <p className="text-3xl font-bold text-ds-primary mb-4">{plan.price}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f: string, j: number) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-ds-foreground">
                    <svg className="w-4 h-4 text-ds-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-2.5 rounded-lg font-medium transition-colors ${plan.popular ? "bg-ds-primary text-white hover:bg-ds-primary/90" : "bg-ds-muted text-ds-foreground hover:bg-ds-muted/80"}`}>{plan.cta}</button>
            </div>
          ))}
        </div>
      </div>

      <section className="py-16 bg-ds-card border-t border-ds-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">{t(locale, 'verticals.how_it_works')}</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[{ step: "1", title: t(locale, "dropshipping.title12_sign_up", "Sign Up"), desc: t(locale, "dropshipping.desc16_create_your_free_acc", "Create your free account and set up your online store.") }, { step: "2", title: t(locale, "dropshipping.title13_choose_products", "Choose Products"), desc: t(locale, "dropshipping.desc17_browse_our_catalog_a", "Browse our catalog and add products to your store.") }, { step: "3", title: t(locale, "dropshipping.title14_sell_online", "Sell Online"), desc: t(locale, "dropshipping.desc18_market_products_to_y", "Market products to your audience across any channel.") }, { step: "4", title: t(locale, "dropshipping.title15_we_ship", "We Ship"), desc: t(locale, "dropshipping.desc19_we_handle_packaging", "We handle packaging and shipping directly to your customers.") }].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">{s.step}</div>
                <h3 className="font-semibold text-ds-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-ds-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
