import { t, formatCurrency, type SupportedLocale } from "@/lib/i18n"
import type { WalletTransaction } from "@/lib/hooks/use-payments"
import { clsx } from "clsx"

interface WalletTransactionsProps {
  transactions: WalletTransaction[]
  locale: string
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

const typeConfig: Record<string, { icon: string; color: string; labelKey: string }> = {
  credit: { icon: "↑", color: "text-ds-success bg-ds-success/10", labelKey: "payment.credit" },
  "top-up": { icon: "↑", color: "text-ds-success bg-ds-success/10", labelKey: "payment.credit" },
  debit: { icon: "↓", color: "text-ds-destructive bg-ds-destructive/10", labelKey: "payment.debit" },
  transfer: { icon: "→", color: "text-ds-accent bg-ds-accent/10", labelKey: "payment.transfer" },
  refund: { icon: "↩", color: "text-ds-warning bg-ds-warning/10", labelKey: "payment.refund" },
}

const statusStyles: Record<string, string> = {
  completed: "bg-ds-success/10 text-ds-success",
  pending: "bg-ds-warning/10 text-ds-warning",
  failed: "bg-ds-destructive/10 text-ds-destructive",
}

export function WalletTransactions({
  transactions,
  locale,
  loading = false,
  hasMore = false,
  onLoadMore,
}: WalletTransactionsProps) {
  const loc = locale as SupportedLocale

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-ds-background rounded-lg border border-ds-border animate-pulse">
            <div className="w-10 h-10 rounded-full bg-ds-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-ds-muted rounded" />
              <div className="h-3 w-24 bg-ds-muted rounded" />
            </div>
            <div className="h-4 w-20 bg-ds-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!transactions.length) {
    return (
      <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-ds-muted flex items-center justify-center mx-auto mb-4">
          <span className="text-xl text-ds-muted-foreground">↔</span>
        </div>
        <p className="text-ds-muted-foreground">{t(locale, "payment.no_transactions")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const config = typeConfig[tx.type] || typeConfig.debit
        const isPositive = tx.type === "credit" || tx.type === "refund" || tx.type === "top-up"

        return (
          <div
            key={tx.id}
            className="flex items-center gap-3 p-4 bg-ds-background rounded-lg border border-ds-border hover:border-ds-border transition-colors"
          >
            <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg", config.color)}>
              {config.icon}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ds-foreground truncate">{tx.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-ds-muted-foreground">
                  {new Date(tx.timestamp!).toLocaleDateString()}
                </span>
                {tx.counterparty && (
                  <>
                    <span className="text-xs text-ds-muted-foreground">·</span>
                    <span className="text-xs text-ds-muted-foreground truncate">{tx.counterparty}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className={clsx("text-sm font-semibold", isPositive ? "text-ds-success" : "text-ds-foreground")}>
                {isPositive ? "+" : "-"}{formatCurrency(Math.abs(tx.amount), tx.currency, loc)}
              </span>
              <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium", statusStyles[tx.status] || statusStyles.pending)}>
                {t(locale, `payment.${tx.status}`)}
              </span>
            </div>
          </div>
        )
      })}

      {hasMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          className="w-full py-3 text-sm font-medium text-ds-muted-foreground hover:text-ds-foreground bg-ds-background rounded-lg border border-ds-border hover:bg-ds-muted transition-colors"
        >
          {t(locale, "payment.load_more")}
        </button>
      )}
    </div>
  )
}
