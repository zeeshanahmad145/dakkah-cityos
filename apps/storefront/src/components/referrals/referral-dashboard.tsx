import { t } from "../../lib/i18n"
import { useTenant } from "../../lib/context/tenant-context"
import type { ReferralDashboardProps } from "@cityos/design-system"
import { ReferralCodeCard } from "./referral-code-card"
import { ReferralStats } from "./referral-stats"
import { ReferralReward } from "./referral-reward"
import { InviteFriendForm } from "./invite-friend-form"

export function ReferralDashboard({
  code,
  link,
  totalReferred,
  successfulReferrals,
  pendingReferrals,
  totalEarned,
  currencyCode = "USD",
  rewardDescription,
  history,
  currentTier,
  nextTier,
  onInvite,
  locale: localeProp,
  className,
}: ReferralDashboardProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"

  return (
    <div className={`space-y-6 ${className || ""}`}>
      <ReferralCodeCard
        code={code}
        link={link}
        rewardDescription={rewardDescription}
        locale={locale}
      />

      <ReferralStats
        totalReferred={totalReferred}
        successfulReferrals={successfulReferrals}
        pendingReferrals={pendingReferrals}
        totalEarned={totalEarned}
        currencyCode={currencyCode}
        locale={locale}
      />

      {(currentTier || nextTier) && (
        <ReferralReward
          currentTier={currentTier}
          nextTier={nextTier}
          currentReferrals={successfulReferrals}
          locale={locale}
        />
      )}

      {onInvite && (
        <InviteFriendForm
          onInvite={onInvite}
          locale={locale}
        />
      )}

      {history.length > 0 && (
        <div className="bg-ds-background border border-ds-border rounded-lg p-4 md:p-6">
          <h3 className="font-semibold text-ds-foreground mb-4">
            {t(locale, "referral.history")}
          </h3>
          <div className="divide-y divide-ds-border">
            {history.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-ds-foreground">{item.referredEmail}</p>
                  <p className="text-xs text-ds-muted-foreground">
                    {new Date(item.date!).toLocaleDateString(locale)}
                  </p>
                </div>
                <div className="text-end">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    item.status === "completed"
                      ? "bg-ds-success/10 text-ds-success"
                      : item.status === "pending"
                        ? "bg-ds-warning/10 text-ds-warning"
                        : "bg-ds-destructive/10 text-ds-destructive"
                  }`}>
                    {t(locale, `referral.status_${item.status}`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
