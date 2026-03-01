import { t, formatCurrency } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/i18n"

export function TradeInCalculator({
  baseValue,
  condition,
  multiplier,
  locale,
  onSubmit,
}: {
  baseValue: { amount: number; currencyCode: string }
  condition: string
  multiplier: number
  locale: string
  onSubmit?: () => void
}) {
  const estimatedValue = baseValue.amount * multiplier

  return (
    <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-ds-foreground">
        {t(locale, "recommerce.value_estimate")}
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ds-muted-foreground">{t(locale, "recommerce.base_value")}</span>
          <span className="text-ds-foreground">
            {formatCurrency((baseValue.amount ?? 0), baseValue.currencyCode, locale as SupportedLocale)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-ds-muted-foreground">{t(locale, "recommerce.condition")}</span>
          <span className="text-ds-foreground capitalize">
            {t(locale, `recommerce.${condition}`)} ({Math.round(multiplier * 100)}%)
          </span>
        </div>

        <div className="border-t border-ds-border pt-3">
          <div className="bg-ds-muted rounded-lg p-4 text-center">
            <p className="text-sm text-ds-muted-foreground mb-1">
              {t(locale, "recommerce.estimated_value")}
            </p>
            <p className="text-3xl font-bold text-ds-primary">
              {formatCurrency(estimatedValue, baseValue.currencyCode, locale as SupportedLocale)}
            </p>
          </div>
        </div>

        <p className="text-xs text-ds-muted-foreground text-center">
          {t(locale, "recommerce.estimate_disclaimer")}
        </p>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90 transition-colors"
      >
        {t(locale, "recommerce.submit_trade_in")}
      </button>
    </div>
  )
}
