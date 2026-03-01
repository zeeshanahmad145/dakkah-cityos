import { t, formatCurrency, formatDate } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/i18n"
import type { DropshipOrder } from "@/lib/hooks/use-dropshipping"

const statusStyles: Record<string, string> = {
  pending: "bg-ds-warning/20 text-ds-warning",
  processing: "bg-ds-accent/20 text-ds-accent-foreground",
  shipped: "bg-ds-primary/20 text-ds-primary",
  delivered: "bg-ds-success/20 text-ds-success",
  cancelled: "bg-ds-destructive/20 text-ds-destructive",
}

export function DropshipOrderCard({
  order,
  locale,
}: {
  order: DropshipOrder
  locale: string
}) {
  return (
    <div className="bg-ds-background border border-ds-border rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ds-muted-foreground">
            {t(locale, "dropshipping.order")} #{order.orderNumber}
          </p>
          <p className="font-semibold text-ds-foreground">{order.supplierName}</p>
        </div>
        <span
          className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
            statusStyles[order.status] || statusStyles.pending
          }`}
        >
          {t(locale, `dropshipping.status_${order.status}`)}
        </span>
      </div>

      <div className="space-y-2">
        {(order.items || []).map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-10 h-10 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-ds-muted flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ds-foreground truncate">{item.title}</p>
              <p className="text-xs text-ds-muted-foreground">
                {t(locale, "dropshipping.qty")}: {item.quantity}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-ds-border">
        <div className="text-sm text-ds-muted-foreground">
          {formatDate(order.createdAt, locale as SupportedLocale)}
        </div>
        <div className="font-semibold text-ds-foreground">
          {formatCurrency((order.total.amount ?? 0), order.total.currencyCode, locale as SupportedLocale)}
        </div>
      </div>

      {order.trackingNumber && (
        <p className="text-xs text-ds-muted-foreground">
          {t(locale, "dropshipping.tracking")}: {order.trackingNumber}
        </p>
      )}
    </div>
  )
}
