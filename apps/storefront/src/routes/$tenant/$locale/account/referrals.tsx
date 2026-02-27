import { createFileRoute } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { ReferralDashboard } from "@/components/referrals/referral-dashboard"
import { useReferralInfo } from "@/lib/hooks/use-commerce-extras"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/account/referrals")({
  component: ReferralsPage,
})

function ReferralsPage() {
  const { locale } = Route.useParams() as { tenant: string; locale: string }
  const { data: referral, isLoading } = useReferralInfo()

  return (
    <AccountLayout
      title={t(locale, "referral.title")}
      description={t(locale, "referral.description")}
    >
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-64 bg-ds-muted rounded-lg animate-pulse" />
          <div className="h-48 bg-ds-muted rounded-lg animate-pulse" />
        </div>
      ) : !referral ? (
        <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
          <p className="text-4xl mb-4">🎁</p>
          <h3 className="text-lg font-semibold text-ds-foreground mb-2">
            {t(locale, "referral.no_referrals_title")}
          </h3>
          <p className="text-sm text-ds-muted-foreground">
            {t(locale, "referral.no_referrals_description")}
          </p>
        </div>
      ) : (
        <ReferralDashboard
          code={referral.code}
          link={referral.link}
          totalReferred={referral.totalReferred}
          successfulReferrals={(referral.history || []).filter((h) => h.status === "completed").length}
          pendingReferrals={(referral.history || []).filter((h) => h.status === "pending").length}
          totalEarned={referral.totalEarned}
          currencyCode={referral.currencyCode}
          rewardDescription={referral.rewardDescription}
          history={referral.history}
          locale={locale}
        />
      )}
    </AccountLayout>
  )
}
