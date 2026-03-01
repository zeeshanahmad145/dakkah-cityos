import { t, formatNumber, type SupportedLocale } from "../../lib/i18n"
import { useTenant } from "../../lib/context/tenant-context"
import type { TierProgressProps } from "@cityos/design-system"

export function TierProgress({
  currentTier,
  nextTier,
  progress,
  pointsToNextTier,
  tiers = [],
  locale: localeProp,
  className,
}: TierProgressProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"

  return (
    <div className={`bg-ds-background border border-ds-border rounded-lg p-4 md:p-6 ${className || ""}`}>
      <h3 className="text-sm font-medium text-ds-foreground mb-3">
        {t(locale, "loyalty.tier_status")}
      </h3>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-ds-foreground">{currentTier}</span>
        {nextTier && (
          <span className="text-sm text-ds-muted-foreground">{nextTier}</span>
        )}
      </div>
      <div className="w-full bg-ds-muted rounded-full h-3">
        <div
          className="bg-ds-primary h-3 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {nextTier && (
        <p className="text-xs text-ds-muted-foreground mt-2">
          {formatNumber(pointsToNextTier, locale as SupportedLocale)} {t(locale, "loyalty.points_to_next_tier")}
        </p>
      )}

      {tiers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-ds-border">
          <div className="flex items-center justify-between gap-1">
            {tiers.map((tier: any, idx: number) => (
              <div key={tier.name} className="flex flex-col items-center text-center flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  tier.name === currentTier
                    ? "bg-ds-primary text-ds-primary-foreground"
                    : idx < tiers.findIndex((t: any) => t.name === currentTier)
                      ? "bg-ds-success/20 text-ds-success"
                      : "bg-ds-muted text-ds-muted-foreground"
                }`}>
                  {tier.icon || (idx + 1)}
                </div>
                <span className="text-[10px] text-ds-muted-foreground mt-1 leading-tight">
                  {tier.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
