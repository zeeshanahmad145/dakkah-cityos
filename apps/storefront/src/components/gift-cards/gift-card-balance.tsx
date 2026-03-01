import { useState } from "react"
import { t, formatCurrency, formatDate, type SupportedLocale } from "../../lib/i18n"
import { useTenant } from "../../lib/context/tenant-context"
import type { GiftCardBalanceProps } from "@cityos/design-system"

const statusColors: Record<string, string> = {
  active: "bg-ds-success/10 text-ds-success",
  redeemed: "bg-ds-primary/10 text-ds-primary",
  expired: "bg-ds-destructive/10 text-ds-destructive",
  disabled: "bg-ds-muted text-ds-muted-foreground",
}

export function GiftCardBalance({
  balance,
  originalAmount,
  currencyCode = "USD",
  code,
  expiresAt,
  status,
  transactions = [],
  locale: localeProp,
  className,
}: GiftCardBalanceProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const [showCode, setShowCode] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const maskedCode = code.replace(/.(?=.{4})/g, "•")

  return (
    <div className={`bg-ds-background border border-ds-border rounded-lg overflow-hidden ${className || ""}`}>
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-ds-muted-foreground uppercase tracking-wider">
              {t(locale, "giftCards.current_balance")}
            </p>
            <p className="text-3xl font-bold text-ds-foreground mt-1">
              {formatCurrency(balance, currencyCode, locale as SupportedLocale)}
            </p>
            <p className="text-xs text-ds-muted-foreground mt-1">
              {t(locale, "giftCards.original_value")}: {formatCurrency(originalAmount, currencyCode, locale as SupportedLocale)}
            </p>
          </div>
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[status] || statusColors.disabled}`}>
            {t(locale, `giftCards.status_${status}`)}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 px-3 py-2 bg-ds-muted rounded-lg font-mono text-sm text-ds-foreground">
            {showCode ? code : maskedCode}
          </div>
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className="px-3 py-2 text-xs font-medium bg-ds-muted text-ds-foreground rounded-lg hover:bg-ds-muted/80 transition-colors"
          >
            {showCode ? t(locale, "giftCards.hide_code") : t(locale, "giftCards.show_code")}
          </button>
        </div>

        {expiresAt && (
          <p className="text-xs text-ds-muted-foreground">
            {t(locale, "giftCards.expires")}: {formatDate(expiresAt, locale as SupportedLocale)}
          </p>
        )}
      </div>

      {transactions.length > 0 && (
        <div className="border-t border-ds-border">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-4 md:px-6 py-3 flex items-center justify-between text-sm font-medium text-ds-foreground hover:bg-ds-muted/50 transition-colors"
          >
            <span>{t(locale, "giftCards.transaction_history")}</span>
            <svg
              className={`w-4 h-4 transition-transform ${showHistory ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showHistory && (
            <div className="px-4 md:px-6 pb-4 divide-y divide-ds-border">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-ds-foreground">{tx.description}</p>
                    <p className="text-xs text-ds-muted-foreground">
                      {formatDate(tx.date, locale as SupportedLocale)}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${
                    tx.type === "purchase" || tx.type === "refund"
                      ? "text-ds-success"
                      : "text-ds-destructive"
                  }`}>
                    {tx.type === "purchase" || tx.type === "refund" ? "+" : "-"}
                    {formatCurrency((tx.amount ?? 0), currencyCode, locale as SupportedLocale)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
