import { t } from "../../lib/i18n"
import { useTenant } from "../../lib/context/tenant-context"
import type { LoyaltyDashboardProps } from "@cityos/design-system"
import { PointsBalance } from "./points-balance"
import { TierProgress } from "./tier-progress"
import { RewardCard } from "./reward-card"
import { PointsHistory } from "./points-history"
import { EarnRulesList } from "./earn-rules-list"

export function LoyaltyDashboard({
  balance,
  lifetimeEarned,
  currentTier,
  nextTier,
  tierProgress,
  pointsToNextTier,
  expiringPoints,
  expiringDate,
  recentActivity,
  rewards,
  earnRules = [],
  onRedeem,
  locale: localeProp,
  className,
}: LoyaltyDashboardProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"

  return (
    <div className={`space-y-6 ${className || ""}`}>
      <PointsBalance
        balance={balance}
        lifetimeEarned={lifetimeEarned}
        animated
        locale={locale}
      />

      <TierProgress
        currentTier={currentTier}
        nextTier={nextTier}
        progress={tierProgress}
        pointsToNextTier={pointsToNextTier}
        locale={locale}
      />

      {expiringPoints && expiringPoints > 0 && (
        <div className="bg-ds-warning/10 border border-ds-warning/20 rounded-lg p-4">
          <p className="text-sm font-medium text-ds-warning">
            ⚠ {t(locale, "loyalty.points_expiring_notice").replace("{points}", expiringPoints.toLocaleString())}
            {expiringDate && (
              <span className="font-normal">
                {" "}{t(locale, "loyalty.by")} {new Date(expiringDate).toLocaleDateString(locale)}
              </span>
            )}
          </p>
        </div>
      )}

      {(rewards?.length ?? 0) > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-ds-foreground mb-4">
            {t(locale, "loyalty.available_rewards")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(rewards || []).map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                userBalance={balance}
                onRedeem={onRedeem}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}

      {(earnRules?.length ?? 0) > 0 && (
        <EarnRulesList rules={earnRules} locale={locale} />
      )}

      {(recentActivity?.length ?? 0) > 0 && (
        <PointsHistory activities={recentActivity} locale={locale} />
      )}
    </div>
  )
}
