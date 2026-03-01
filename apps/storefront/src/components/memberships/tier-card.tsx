import { t, formatCurrency } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/i18n"
import { Link } from "@tanstack/react-router"
import type { MembershipTier } from "@/lib/hooks/use-memberships"
import { BenefitsList } from "./benefits-list"

const billingLabels: Record<string, string> = {
  monthly: "blocks.per_month",
  yearly: "blocks.per_year",
  lifetime: "membership.lifetime",
}

interface TierCardProps {
  tier: MembershipTier
  locale: string
  prefix: string
  variant?: "default" | "featured" | "compact"
  onSelect?: (tierId: string) => void
}

export function TierCard({
  tier,
  locale,
  prefix,
  variant = "default",
  onSelect,
}: TierCardProps) {
  const loc = locale as SupportedLocale
  const isFeatured = variant === "featured" || tier.isPopular
  const isCompact = variant === "compact"

  if (isCompact) {
    return (
      <div className="bg-ds-background border border-ds-border rounded-xl p-4 hover:border-ds-ring transition-colors">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-ds-foreground">{tier.name}</h3>
          {tier.isPopular && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-ds-primary/20 text-ds-primary">
              {t(locale, "blocks.most_popular")}
            </span>
          )}
        </div>
        <p className="text-lg font-bold text-ds-foreground">
          {formatCurrency((tier.price.amount ?? 0), tier.price.currencyCode, loc)}
          <span className="text-sm font-normal text-ds-muted-foreground">
            {t(locale, billingLabels[tier.billingPeriod] || "blocks.per_month")}
          </span>
        </p>
        <BenefitsList
          benefits={tier.benefits}
          variant="compact"
          maxVisible={3}
        />
        <Link
          to={`${prefix}/memberships/${tier.id}` as never}
          className="block w-full text-center mt-3 px-4 py-2 text-sm font-medium rounded-lg bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90 transition-colors"
        >
          {t(locale, "blocks.view_details")}
        </Link>
      </div>
    )
  }

  return (
    <div
      className={`relative bg-ds-background rounded-xl overflow-hidden transition-colors ${
        isFeatured
          ? "border-2 border-ds-primary shadow-lg"
          : "border border-ds-border hover:border-ds-ring"
      }`}
    >
      {tier.isPopular && (
        <div className="bg-ds-primary text-ds-primary-foreground text-center py-1.5 text-xs font-semibold">
          {t(locale, "blocks.most_popular")}
        </div>
      )}

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-ds-foreground">{tier.name}</h3>
          {tier.description && (
            <p className="mt-1 text-sm text-ds-muted-foreground">
              {tier.description}
            </p>
          )}
        </div>

        <div>
          <span className="text-3xl font-bold text-ds-foreground">
            {formatCurrency((tier.price.amount ?? 0), tier.price.currencyCode, loc)}
          </span>
          <span className="text-sm text-ds-muted-foreground ms-1">
            {t(locale, billingLabels[tier.billingPeriod] || "blocks.per_month")}
          </span>
        </div>

        {tier.isCurrent && (
          <div className="px-3 py-2 rounded-lg bg-ds-success/10 border border-ds-success/20 text-center">
            <span className="text-sm font-medium text-ds-success">
              {t(locale, "membership.current_plan")}
            </span>
          </div>
        )}

        {tier.trialDays && !tier.isCurrent && (
          <p className="text-xs text-ds-muted-foreground text-center">
            {tier.trialDays}-day free trial
          </p>
        )}

        <div className="border-t border-ds-border pt-4">
          <h4 className="text-sm font-semibold text-ds-foreground mb-3">
            {t(locale, "membership.benefits")}
          </h4>
          <BenefitsList benefits={tier.benefits} maxVisible={8} />
        </div>

        {tier.isCurrent ? (
          <Link
            to={`${prefix}/memberships/${tier.id}` as never}
            className="block w-full text-center px-4 py-3 text-sm font-medium rounded-lg border border-ds-border text-ds-foreground hover:bg-ds-muted transition-colors"
          >
            {t(locale, "blocks.view_details")}
          </Link>
        ) : (
          <button
            onClick={() => onSelect?.(tier.id)}
            className={`block w-full text-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isFeatured
                ? "bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90"
                : "border border-ds-border text-ds-foreground hover:bg-ds-muted"
            }`}
          >
            {t(locale, "blocks.get_started")}
          </button>
        )}
      </div>
    </div>
  )
}
