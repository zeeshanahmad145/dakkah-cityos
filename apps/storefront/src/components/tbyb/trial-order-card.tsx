import { t, formatCurrency, formatDate } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/i18n"

export interface TrialOrder {
  id: string
  orderNumber: string
  status: "active" | "returning" | "completed" | "converted" | "expired"
  items: { id: string; title: string; thumbnail?: string; price: { amount: number; currencyCode: string }; kept?: boolean }[]
  trialEndsAt: string
  createdAt: string
}

const statusStyles: Record<string, string> = {
  active: "bg-ds-success/20 text-ds-success",
  returning: "bg-ds-warning/20 text-ds-warning",
  completed: "bg-ds-muted text-ds-muted-foreground",
  converted: "bg-ds-primary/20 text-ds-primary",
  expired: "bg-ds-destructive/20 text-ds-destructive",
}

export function TrialOrderCard({
  order,
  locale,
  onKeepItems,
  onReturnAll,
}: {
  order: TrialOrder
  locale: string
  onKeepItems?: (itemIds: string[]) => void
  onReturnAll?: () => void
}) {
  const daysRemaining = Math.max(0, Math.ceil(
    (new Date(order.trialEndsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ))

  return (
    <div className="bg-ds-background border border-ds-border rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ds-muted-foreground">
            {t(locale, "tbyb.trial_order")} #{order.orderNumber}
          </p>
          <p className="text-xs text-ds-muted-foreground mt-0.5">
            {formatDate(order.createdAt, locale as SupportedLocale)}
          </p>
        </div>
        <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${statusStyles[order.status]}`}>
          {t(locale, `tbyb.status_${order.status}`)}
        </span>
      </div>

      {order.status === "active" && daysRemaining > 0 && (
        <div className="bg-ds-primary/10 rounded-lg px-4 py-2 text-center">
          <span className="text-sm font-medium text-ds-primary">
            {daysRemaining} {t(locale, "tbyb.days_remaining")}
          </span>
        </div>
      )}

      <div className="space-y-2">
        {(order.items || []).map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            {item.thumbnail ? (
              <img loading="lazy" src={item.thumbnail} alt={item.title} className="w-12 h-12 rounded object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded bg-ds-muted flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ds-foreground truncate">{item.title}</p>
              <p className="text-xs text-ds-muted-foreground">
                {formatCurrency((item.price.amount ?? 0), item.price.currencyCode, locale as SupportedLocale)}
              </p>
            </div>
            {item.kept != null && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                item.kept ? "bg-ds-success/20 text-ds-success" : "bg-ds-muted text-ds-muted-foreground"
              }`}>
                {item.kept ? t(locale, "tbyb.kept") : t(locale, "tbyb.returned")}
              </span>
            )}
          </div>
        ))}
      </div>

      {order.status === "active" && (
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => onKeepItems?.((order.items || []).map((i) => i.id))}
            className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90 transition-colors"
          >
            {t(locale, "tbyb.keep_items")}
          </button>
          <button
            type="button"
            onClick={onReturnAll}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-ds-border text-ds-muted-foreground hover:border-ds-ring transition-colors"
          >
            {t(locale, "tbyb.return_all")}
          </button>
        </div>
      )}
    </div>
  )
}
