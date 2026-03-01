import { createFileRoute } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { LoyaltyDashboard as LoyaltyDashboardLegacy } from "@/components/commerce/loyalty-dashboard"
import { LoyaltyDashboard } from "@/components/loyalty/loyalty-dashboard"
import { PointsHistory } from "@/components/loyalty/points-history"
import { useLoyaltyPoints } from "@/lib/hooks/use-commerce-extras"
import { t, formatNumber, formatDate, type SupportedLocale } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/account/loyalty")({
  component: LoyaltyPage,
})

const defaultEarnRules = [
  { id: "purchase", action: "purchase", description: "Earn 1 point per $1 spent", pointsReward: 1, icon: "🛒" },
  { id: "review", action: "review", description: "Write a product review", pointsReward: 50, icon: "⭐" },
  { id: "referral", action: "referral", description: "Refer a friend who makes a purchase", pointsReward: 200, icon: "👥" },
  { id: "birthday", action: "birthday", description: "Birthday bonus points", pointsReward: 100, icon: "🎂" },
  { id: "signup", action: "signup", description: "Create an account", pointsReward: 50, icon: "🎉" },
]

function LoyaltyPage() {
  const { locale, tenant } = Route.useParams() as { tenant: string; locale: string }
  const { data: loyalty, isLoading } = useLoyaltyPoints()

  return (
    <AccountLayout
      title={t(locale, "loyalty.title")}
      description={t(locale, "loyalty.description")}
    >
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-32 bg-ds-muted rounded-lg animate-pulse" />
          <div className="h-24 bg-ds-muted rounded-lg animate-pulse" />
          <div className="h-48 bg-ds-muted rounded-lg animate-pulse" />
        </div>
      ) : !loyalty ? (
        <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
          <p className="text-4xl mb-4">🎯</p>
          <h3 className="text-lg font-semibold text-ds-foreground mb-2">
            {t(locale, "loyalty.no_points_title")}
          </h3>
          <p className="text-sm text-ds-muted-foreground">
            {t(locale, "loyalty.no_points_description")}
          </p>
        </div>
      ) : (
        <LoyaltyDashboard
          balance={loyalty.balance}
          lifetimeEarned={loyalty.lifetimeEarned}
          currentTier={loyalty.currentTier}
          nextTier={loyalty.nextTier}
          tierProgress={loyalty.tierProgress}
          pointsToNextTier={loyalty.pointsToNextTier}
          expiringPoints={loyalty.expiringPoints}
          expiringDate={loyalty.expiringDate}
          recentActivity={loyalty.recentActivity}
          rewards={loyalty.rewards}
          earnRules={defaultEarnRules}
          locale={locale}
        />
      )}
    </AccountLayout>
  )
}
