// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { t, formatCurrency, type SupportedLocale } from "@/lib/i18n"
import { lazy, Suspense, useState } from "react"
import { Loading } from "@/components/ui/loading"

const ConditionGrader = lazy(() => import("@/components/recommerce/condition-grader").then(m => ({ default: m.ConditionGrader })))
const TradeInCalculator = lazy(() => import("@/components/recommerce/trade-in-calculator").then(m => ({ default: m.TradeInCalculator })))
const TradeInItemCard = lazy(() => import("@/components/recommerce/trade-in-item-card").then(m => ({ default: m.TradeInItemCard })))

export const Route = createFileRoute("/$tenant/$locale/trade-in")({
  component: TradeInPage,
  head: () => ({
    meta: [
      { title: "Trade-In | Dakkah CityOS" },
      { name: "description", content: "Trade in your items on Dakkah CityOS" },
    ],
  }),
})

const conditionMultipliers: Record<string, number> = {
  excellent: 1.0,
  good: 0.75,
  fair: 0.5,
  poor: 0.25,
}

const sampleCategories = [
  "electronics",
  "phones",
  "laptops",
  "tablets",
  "wearables",
]

function TradeInPage() {
  const { locale } = Route.useParams() as { tenant: string; locale: string }

  const howItWorksSteps = [
    { step: 1, title: "Select Your Item", description: "Choose the product you'd like to trade in from your order history or search our catalog.", icon: "📦" },
    { step: 2, title: "Grade Condition", description: "Honestly assess the condition of your item using our simple grading tool.", icon: "🔍" },
    { step: 3, title: "Get Your Estimate", description: "Receive an instant estimated trade-in value based on the item and its condition.", icon: "💰" },
    { step: 4, title: "Ship & Get Credit", description: "Ship your item to us for free and receive store credit once verified.", icon: "🚀" },
  ]
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCondition, setSelectedCondition] = useState<string | undefined>("good")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-ds-muted">
      <div className="bg-ds-background border-b border-ds-border">
        <div className="content-container py-12 sm:py-16 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ds-primary/10 text-ds-primary text-sm font-medium">
            <span>♻️</span>
            {t(locale, "commerce.trade_in_title")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ds-foreground">
            Trade In, Trade Up
          </h1>
          <p className="mt-3 text-lg text-ds-muted-foreground max-w-2xl mx-auto">
            {t(locale, "commerce.trade_in_subtitle")}
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <a href="#calculator" className="px-6 py-3 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
              Get Your Estimate
            </a>
            <a href="#how-it-works" className="px-6 py-3 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors">
              How It Works
            </a>
          </div>
        </div>
      </div>

      <div className="content-container py-8 sm:py-12 space-y-12">
        <section id="how-it-works">
          <h2 className="text-xl font-bold text-ds-foreground text-center mb-8">
            {t(locale, "commerce.how_it_works")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorksSteps.map((step) => (
              <div
                key={step.step}
                className="bg-ds-background rounded-xl border border-ds-border p-6 text-center space-y-3"
              >
                <div className="text-3xl">{step.icon}</div>
                <div className="w-8 h-8 rounded-full bg-ds-primary/10 text-ds-primary flex items-center justify-center mx-auto text-sm font-bold">
                  {step.step}
                </div>
                <h3 className="font-semibold text-ds-foreground">{step.title}</h3>
                <p className="text-sm text-ds-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ds-foreground mb-4">
            {t(locale, "commerce.find_product")}
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(locale, "commerce.search_placeholder")}
              className="flex-1 px-4 py-3 bg-ds-background border border-ds-border rounded-lg text-sm text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-primary"
            />
            <button
              type="button"
              className="px-6 py-3 bg-ds-primary text-ds-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              {t(locale, "common.search")}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {sampleCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                  selectedCategory === cat
                    ? "border-ds-primary bg-ds-primary text-ds-primary-foreground"
                    : "border-ds-border bg-ds-background text-ds-muted-foreground hover:bg-ds-muted"
                }`}
              >
                {t(locale, `commerce.category_${cat}`)}
              </button>
            ))}
          </div>
        </section>

        <section id="calculator" className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-ds-foreground">Estimate Your Trade-In Value</h2>
            <p className="text-ds-muted-foreground mt-2">Select the condition of your item to see your estimated credit</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Suspense fallback={<Loading />}>
              <ConditionGrader
                selectedCondition={selectedCondition}
                locale={locale}
                onSelect={setSelectedCondition}
              />
            </Suspense>
            <Suspense fallback={<Loading />}>
              <TradeInCalculator
                baseValue={{ amount: 15000, currencyCode: "USD" }}
                condition={selectedCondition || "good"}
                multiplier={conditionMultipliers[selectedCondition || "good"] || 0.75}
                locale={locale}
              />
            </Suspense>
          </div>
        </section>

        <section className="bg-ds-card border border-ds-border rounded-xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-ds-foreground">Ready to Trade In?</h2>
          <p className="text-ds-muted-foreground max-w-lg mx-auto">
            Start by selecting an item from your past orders or browse our eligible products catalog.
          </p>
          <button
            type="button"
            className="px-6 py-3 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Browse Eligible Items
          </button>
        </section>
      </div>
    </div>
  )
}
