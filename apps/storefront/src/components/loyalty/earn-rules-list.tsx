import { t, formatNumber, type SupportedLocale } from "../../lib/i18n"
import { useTenant } from "../../lib/context/tenant-context"
import type { EarnRulesListProps } from "@cityos/design-system"

const defaultIcons: Record<string, string> = {
  purchase: "🛒",
  review: "⭐",
  referral: "👥",
  birthday: "🎂",
  signup: "🎉",
}

export function EarnRulesList({
  rules,
  locale: localeProp,
  className,
}: EarnRulesListProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"

  return (
    <div className={`bg-ds-background border border-ds-border rounded-lg p-4 md:p-6 ${className || ""}`}>
      <h3 className="font-semibold text-ds-foreground mb-4">
        {t(locale, "loyalty.how_to_earn")}
      </h3>
      <div className="space-y-3">
        {rules.map((rule: any) => (
          <div
            key={rule.id}
            className="flex items-center gap-3 p-3 bg-ds-muted/50 rounded-lg"
          >
            <div className="w-10 h-10 rounded-full bg-ds-primary/10 flex items-center justify-center text-lg flex-shrink-0">
              {rule.icon || defaultIcons[rule.action] || "✨"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ds-foreground">{rule.description}</p>
              {rule.multiplier && rule.multiplier > 1 && (
                <p className="text-xs text-ds-success mt-0.5">
                  {rule.multiplier}x {t(locale, "loyalty.multiplier")}
                </p>
              )}
            </div>
            <div className="text-end flex-shrink-0">
              <span className="text-sm font-bold text-ds-primary">
                +{formatNumber(rule.pointsReward, locale as SupportedLocale)}
              </span>
              <p className="text-[10px] text-ds-muted-foreground">{t(locale, "loyalty.pts")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
