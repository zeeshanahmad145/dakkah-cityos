// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

const fallbackItems = [
  {
    id: "tier-1", name: "Bronze", color: "ds-warning", bg: "from-ds-warning to-ds-warning/90", points_required: 0, badge_emoji: "🥉",
    perks: ["loyalty.perk_bronze_1", "loyalty.perk_bronze_2", "loyalty.perk_bronze_3", "loyalty.perk_bronze_4"],
    description: "Start earning rewards from your very first purchase. Every dollar spent earns you 1 point."
  },
  {
    id: "tier-2", name: "Silver", color: "ds-muted-foreground", bg: "from-ds-muted-foreground to-ds-muted-foreground/80", points_required: 500, badge_emoji: "🥈",
    perks: ["loyalty.perk_silver_1", "loyalty.perk_silver_2", "loyalty.perk_silver_3", "loyalty.perk_silver_4", "loyalty.perk_silver_5", "loyalty.perk_silver_6"],
    description: "Reach Silver status with 500 points and unlock premium shopping benefits."
  },
  {
    id: "tier-3", name: "Gold", color: "yellow-500", bg: "from-ds-warning to-ds-warning", points_required: 2000, badge_emoji: "🥇",
    perks: ["loyalty.perk_gold_1", "loyalty.perk_gold_2", "loyalty.perk_gold_3", "loyalty.perk_gold_4", "loyalty.perk_gold_5", "loyalty.perk_gold_6", "loyalty.perk_gold_7", "loyalty.perk_gold_8"],
    description: "Gold members enjoy the best perks with 2,000 points. Shop more, save more."
  },
  {
    id: "tier-4", name: "Platinum", color: "ds-muted-foreground", bg: "from-ds-muted-foreground to-ds-primary", points_required: 5000, badge_emoji: "💎",
    perks: ["loyalty.perk_platinum_1", "loyalty.perk_platinum_2", "loyalty.perk_platinum_3", "loyalty.perk_platinum_4", "loyalty.perk_platinum_5", "loyalty.perk_platinum_6", "loyalty.perk_platinum_7", "loyalty.perk_platinum_8", "loyalty.perk_platinum_9", "loyalty.perk_platinum_10"],
    description: "The ultimate tier. Platinum members with 5,000+ points enjoy unmatched luxury benefits."
  },
]

export const Route = createFileRoute("/$tenant/$locale/loyalty-program/")({
  component: LoyaltyProgramPage,
  head: () => ({
    meta: [
      { title: "Loyalty Program | Dakkah CityOS" },
      { name: "description", content: "Join the loyalty program on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/loyalty`, {
        headers: {
          "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_b52dbbf895687445775c819d8cd5cb935f27231ef3a32ade606b58d9e5798d3a",
        },
      })
      if (!resp.ok) return { items: fallbackItems, count: fallbackItems.length }
      const data = await resp.json()
      const raw = data.items || data.tiers || data.programs || []
      return { items: raw.length > 0 ? raw : fallbackItems, count: raw.length > 0 ? (data.count || raw.length) : fallbackItems.length }
    } catch {
      return { items: fallbackItems, count: fallbackItems.length }
    }
  },
})

function LoyaltyProgramPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-warning to-ds-warning text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">Loyalty Program</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'loyaltyProgram.title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, 'loyaltyProgram.subtitle')}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} tiers</span>
            <span>|</span>
            <span>{t(locale, "loyalty.badge_earn_points", "Earn 1 point per $1")}</span>
            <span>|</span>
            <span>{t(locale, "loyalty.badge_up_to_discount", "Up to 20% off")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {items.length === 0 ? (
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'loyaltyProgram.no_results')}</h3>
            <p className="text-ds-muted-foreground text-sm">Check back later for our loyalty program details.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {items.map((tier: any, index: number) => (
              <div
                key={tier.id}
                className="group bg-ds-background border border-ds-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row">
                  <div className={`bg-gradient-to-br ${tier.bg || "from-ds-warning to-ds-warning"} p-8 md:w-72 flex flex-col items-center justify-center text-white`}>
                    <span className="text-5xl mb-3">{tier.badge_emoji || "⭐"}</span>
                    <h3 className="text-2xl font-bold">{tier.name}</h3>
                    <p className="text-white/80 text-sm mt-1">
                      {tier.points_required > 0 ? `${tier.points_required.toLocaleString()} points` : "Starting tier"}
                    </p>
                  </div>
                  <div className="flex-1 p-6 md:p-8">
                    <p className="text-ds-muted-foreground mb-4">{tier.description}</p>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-ds-foreground mb-3">Perks & Benefits:</h4>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {(tier.perks || []).map((perk: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <svg className="w-4 h-4 text-ds-warning mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-ds-foreground">{t(locale, perk, perk)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-ds-border">
                      <div className="text-sm text-ds-muted-foreground">
                        {tier.points_required > 0
                          ? `Earn ${tier.points_required.toLocaleString()} points to unlock`
                          : "Available to all members"}
                      </div>
                      <button className="px-5 py-2 text-sm font-semibold text-white bg-ds-warning rounded-lg hover:bg-ds-warning/90 transition-colors">
                        {t(locale, 'loyaltyProgram.join_program')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <section className="py-16 bg-ds-card border-t border-ds-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">{t(locale, 'verticals.how_it_works')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-warning text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Sign Up Free</h3>
              <p className="text-sm text-ds-muted-foreground">Create an account and automatically start earning points.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-warning text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Earn Points</h3>
              <p className="text-sm text-ds-muted-foreground">Get 1 point for every $1 spent. Bonus points on special days.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-warning text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Unlock Rewards</h3>
              <p className="text-sm text-ds-muted-foreground">Rise through tiers and enjoy increasing benefits and discounts.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
