// @ts-nocheck
import { formatCurrency } from "../../lib/i18n"
import { useTenant } from "../../lib/context/tenant-context"
import { t } from "../../lib/i18n"

interface BNPLEligibilityBadgeProps {
  price: number
  currency?: string
  locale?: string
}

export default function BNPLEligibilityBadge({ price, currency = "USD", locale: localeProp }: BNPLEligibilityBadgeProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"

  const installments = 4
  const installmentAmount = price / installments

  if (price <= 0) {
    return null
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-ds-surface border border-ds-border rounded-full">
      <svg className="w-3.5 h-3.5 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <span className="text-xs font-medium text-ds-foreground">
        {t(locale, "checkout.bnpl_pay_in") !== "checkout.bnpl_pay_in"
          ? t(locale, "checkout.bnpl_pay_in")
          : "Pay in 4"}
      </span>
      <span className="text-xs text-ds-muted">
        {formatCurrency(installmentAmount, currency, locale as import("@/lib/i18n").SupportedLocale)}
      </span>
    </div>
  )
}
