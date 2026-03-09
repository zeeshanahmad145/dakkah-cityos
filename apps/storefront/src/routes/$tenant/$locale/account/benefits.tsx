// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/account/benefits")({
  component: BenefitsPage,
  head: () => ({
    meta: [
      { title: "My Benefits | Dakkah CityOS" },
      {
        name: "description",
        content: "Explore the benefits included in your subscription plan",
      },
    ],
  }),
  loader: async () => {
    try {
      const res = await fetch("/api/subscription-benefits/mine", {
        credentials: "include",
      })
      const data = await res.json()
      return { benefits: data.benefits ?? [], plan: data.plan ?? null }
    } catch {
      return { benefits: [], plan: null }
    }
  },
})

const BENEFIT_ICONS: Record<string, string> = {
  discount: "🏷️",
  free_delivery: "🚚",
  early_access: "⚡",
  priority_support: "🎯",
  cashback: "💵",
  access: "🔓",
  bonus_loyalty: "⭐",
  extended_warranty: "🛡️",
  free_cancellation: "↩️",
  exclusive_content: "🎬",
  dedicated_account_manager: "👤",
}

function BenefitsPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const data = Route.useLoaderData()
  const benefits = data?.benefits ?? []
  const plan = data?.plan

  const grouped = benefits.reduce((acc: Record<string, any[]>, b: any) => {
    const key = b.applies_to_offer_types?.join("+") ?? "all"
    if (!acc[key]) acc[key] = []
    acc[key].push(b)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-white/70 mb-4">
            <Link
              to={`${prefix}/account` as never}
              className="hover:text-white"
            >
              Account
            </Link>
            <span>/</span>
            <span className="text-white">Benefits</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">My Benefits</h1>
          {plan ? (
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium">
              <span>⭐</span> {plan.name ?? plan.id} plan
            </div>
          ) : (
            <p className="text-white/80">
              Your subscription benefits and perks
            </p>
          )}
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {benefits.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎁</div>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">
              No benefits yet
            </h2>
            <p className="text-ds-muted-foreground mb-6">
              Upgrade to a premium plan to unlock cross-vertical benefits,
              discounts, and perks.
            </p>
            <Link
              to={`${prefix}/subscriptions` as never}
              className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
            >
              Explore Plans
            </Link>
          </div>
        ) : (
          <>
            {/* Benefit cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {benefits.map((b: any) => (
                <div
                  key={b.id}
                  className="border border-ds-border rounded-xl p-5 bg-ds-background hover:shadow-md hover:border-amber-400/50 transition-all"
                >
                  <div className="text-2xl mb-3">
                    {BENEFIT_ICONS[b.benefit_type] ?? "🎁"}
                  </div>
                  <div className="font-semibold text-ds-foreground mb-1">
                    {b.benefit_type?.replace(/_/g, " ")}
                  </div>
                  {b.discount_pct > 0 && (
                    <div className="text-lg font-bold text-amber-600 mb-1">
                      {b.discount_pct}% off
                    </div>
                  )}
                  {b.applies_to_offer_types?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {b.applies_to_offer_types.map((type: string) => (
                        <span
                          key={type}
                          className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                  {b.max_uses_per_period && (
                    <p className="text-xs text-ds-muted-foreground mt-2">
                      Up to {b.max_uses_per_period} uses per period
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* How to use section */}
            <div className="border border-ds-border rounded-xl p-6 bg-ds-background">
              <h3 className="font-semibold text-ds-foreground mb-3">
                How to Use Your Benefits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-ds-muted-foreground">
                <div className="flex items-start gap-3">
                  <span className="text-lg">🛒</span>
                  <div>
                    <span className="font-medium text-ds-foreground">
                      At Checkout
                    </span>
                    <br />
                    Discounts are automatically applied when you check out with
                    an eligible offer type.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lg">📅</span>
                  <div>
                    <span className="font-medium text-ds-foreground">
                      Period Limits
                    </span>
                    <br />
                    Benefits with usage limits reset at the start of each
                    billing cycle.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lg">⬆️</span>
                  <div>
                    <span className="font-medium text-ds-foreground">
                      Upgrade for More
                    </span>
                    <br />
                    Higher plans unlock more benefit types and higher discount
                    percentages.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
