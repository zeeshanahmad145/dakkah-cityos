import { t, formatNumber, type SupportedLocale } from "../../lib/i18n"
import { useTenant } from "../../lib/context/tenant-context"
import type { ReferralRewardProps } from "@cityos/design-system"

export function ReferralReward({
  currentTier,
  nextTier,
  currentReferrals,
  locale: localeProp,
  className,
}: ReferralRewardProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"

  const progress = nextTier
    ? Math.min(
        ((currentReferrals - (currentTier?.minReferrals || 0)) /
          (nextTier.minReferrals - (currentTier?.minReferrals || 0))) *
          100,
        100
      )
    : 100

  const referralsToNext = nextTier
    ? nextTier.minReferrals - currentReferrals
    : 0

  return (
    <div className={`bg-ds-background border border-ds-border rounded-lg p-4 md:p-6 ${className || ""}`}>
      <h3 className="font-semibold text-ds-foreground mb-3">
        {t(locale, "referral.reward_tiers")}
      </h3>

      {currentTier && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ds-foreground">
                {currentTier.name}
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-ds-primary/10 text-ds-primary rounded-full">
                {currentTier.rewardMultiplier}x {t(locale, "referral.rewards_multiplier")}
              </span>
            </div>
            {nextTier && (
              <span className="text-sm text-ds-muted-foreground">{nextTier.name}</span>
            )}
          </div>

          {nextTier && (
            <>
              <div className="w-full bg-ds-muted rounded-full h-2.5">
                <div
                  className="bg-ds-primary h-2.5 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-ds-muted-foreground mt-2">
                {formatNumber(referralsToNext, locale as SupportedLocale)} {t(locale, "referral.referrals_to_next")}
              </p>
            </>
          )}
        </div>
      )}

      {currentTier?.benefits && currentTier.benefits.length > 0 && (
        <div className="pt-3 border-t border-ds-border">
          <p className="text-sm font-medium text-ds-foreground mb-2">
            {t(locale, "referral.current_benefits")}
          </p>
          <ul className="space-y-1.5">
            {currentTier.benefits.map((benefit: any, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-ds-muted-foreground">
                <svg className="w-4 h-4 text-ds-success mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
