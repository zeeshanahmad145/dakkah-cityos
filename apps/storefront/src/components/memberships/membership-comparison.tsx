import { t, formatCurrency } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/i18n"
import type { MembershipTier } from "@/lib/hooks/use-memberships"

interface MembershipComparisonProps {
  tiers: MembershipTier[]
  locale: string
  currentTierId?: string
  onTierSelect?: (tierId: string) => void
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-ds-success mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="w-5 h-5 text-ds-muted-foreground/40 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export function MembershipComparison({
  tiers,
  locale,
  currentTierId,
  onTierSelect,
}: MembershipComparisonProps) {
  const loc = locale as SupportedLocale

  const allBenefitTitles = Array.from(
    new Set(tiers.flatMap((tier) => (tier.benefits || []).map((b) => b.title)))
  )

  const billingLabels: Record<string, string> = {
    monthly: "blocks.per_month",
    yearly: "blocks.per_year",
    lifetime: "membership.lifetime",
  }

  if (tiers.length === 0) return null

  return (
    <div className="bg-ds-background border border-ds-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 bg-ds-muted border-b border-ds-border">
        <h3 className="text-lg font-semibold text-ds-foreground">
          {t(locale, "membership.compare_plans")}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-ds-border">
              <th className="text-start px-6 py-4 text-sm font-medium text-ds-muted-foreground w-1/4">
                {t(locale, "blocks.feature")}
              </th>
              {tiers.map((tier) => (
                <th key={tier.id} className="px-4 py-4 text-center">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-ds-foreground">{tier.name}</p>
                    <p className="text-sm text-ds-muted-foreground">
                      {formatCurrency(tier.price.amount, tier.price.currencyCode, loc)}
                      {t(locale, billingLabels[tier.billingPeriod] || "blocks.per_month")}
                    </p>
                    {tier.isPopular && (
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-ds-primary/20 text-ds-primary">
                        {t(locale, "blocks.most_popular")}
                      </span>
                    )}
                    {tier.id === currentTierId && (
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-ds-success/20 text-ds-success">
                        {t(locale, "membership.current_plan")}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ds-border">
            {allBenefitTitles.map((benefitTitle) => (
              <tr key={benefitTitle} className="hover:bg-ds-muted/50 transition-colors">
                <td className="px-6 py-3 text-sm text-ds-foreground">
                  {benefitTitle}
                </td>
                {tiers.map((tier) => {
                  const benefit = tier.benefits.find((b) => b.title === benefitTitle)
                  return (
                    <td key={tier.id} className="px-4 py-3 text-center">
                      {!benefit ? (
                        <XIcon />
                      ) : benefit.value ? (
                        <span className="text-sm font-medium text-ds-foreground">
                          {benefit.value}
                        </span>
                      ) : benefit.included ? (
                        <CheckIcon />
                      ) : (
                        <XIcon />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-ds-border">
              <td className="px-6 py-4" />
              {tiers.map((tier) => (
                <td key={tier.id} className="px-4 py-4 text-center">
                  {tier.id === currentTierId ? (
                    <span className="inline-block px-4 py-2 text-sm font-medium rounded-lg border border-ds-border text-ds-muted-foreground">
                      {t(locale, "membership.current_plan")}
                    </span>
                  ) : (
                    <button
                      onClick={() => onTierSelect?.(tier.id)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        tier.isPopular
                          ? "bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90"
                          : "border border-ds-border text-ds-foreground hover:bg-ds-muted"
                      }`}
                    >
                      {t(locale, "blocks.select_option")}
                    </button>
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
