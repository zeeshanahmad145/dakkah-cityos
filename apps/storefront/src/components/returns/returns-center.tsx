import { t, formatCurrency, type SupportedLocale } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { clsx } from "clsx"

interface ReturnSummary {
  id: string
  orderId: string
  status: "initiated" | "shipped" | "received" | "refunded" | "rejected"
  itemCount: number
  refundAmount?: { amount: number; currency: string }
  createdAt: string
  updatedAt: string
}

interface ReturnsCenterProps {
  returns: ReturnSummary[]
  onViewReturn: (returnId: string) => void
  onStartReturn?: () => void
  locale?: string
  className?: string
}

const statusConfig: Record<string, { colorClass: string; i18nKey: string }> = {
  initiated: { colorClass: "bg-ds-warning/10 text-ds-warning", i18nKey: "returns.status_initiated" },
  shipped: { colorClass: "bg-ds-info/10 text-ds-info", i18nKey: "returns.status_shipped" },
  received: { colorClass: "bg-ds-primary/10 text-ds-primary", i18nKey: "returns.status_received" },
  refunded: { colorClass: "bg-ds-success/10 text-ds-success", i18nKey: "returns.status_refunded" },
  rejected: { colorClass: "bg-ds-destructive/10 text-ds-destructive", i18nKey: "returns.status_rejected" },
}

export function ReturnsCenter({
  returns,
  onViewReturn,
  onStartReturn,
  locale: localeProp,
  className,
}: ReturnsCenterProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"

  return (
    <div className={clsx("space-y-6", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ds-foreground">{t(locale, "returns.center_title")}</h2>
          <p className="text-sm text-ds-muted-foreground mt-0.5">
            {t(locale, "returns.center_desc")}
          </p>
        </div>
        {onStartReturn && (
          <button
            onClick={onStartReturn}
            className="px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
          >
            {t(locale, "returns.start_return")}
          </button>
        )}
      </div>

      {!returns.length ? (
        <div className="bg-ds-muted rounded-xl p-8 text-center">
          <span className="text-4xl block mb-3">📦</span>
          <p className="text-ds-muted-foreground">{t(locale, "returns.no_returns")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((ret) => {
            const config = statusConfig[ret.status] || statusConfig.initiated
            return (
              <button
                key={ret.id}
                onClick={() => onViewReturn(ret.id)}
                className="w-full text-start bg-ds-card border border-ds-border rounded-lg p-4 hover:border-ds-foreground transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-ds-foreground">
                        {t(locale, "returns.return_id")}: {ret.id}
                      </span>
                      <span className={clsx("text-xs font-medium px-2 py-0.5 rounded", config.colorClass)}>
                        {t(locale, config.i18nKey)}
                      </span>
                    </div>
                    <p className="text-xs text-ds-muted-foreground">
                      {t(locale, "returns.order_id")}: {ret.orderId} · {ret.itemCount} {t(locale, "returns.items")}
                    </p>
                    <p className="text-xs text-ds-muted-foreground mt-1">
                      {new Date(ret.createdAt!).toLocaleDateString(locale)}
                    </p>
                  </div>
                  {ret.refundAmount && (
                    <span className="text-sm font-semibold text-ds-foreground flex-shrink-0">
                      {formatCurrency((ret.refundAmount.amount ?? 0), ret.refundAmount.currency, locale as SupportedLocale)}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
