import { t, formatCurrency, formatDate } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/i18n"

export interface TradeInItem {
  id: string
  title: string
  thumbnail?: string
  estimatedValue: { amount: number; currencyCode: string }
  condition: "excellent" | "good" | "fair" | "poor"
  status: "pending" | "evaluated" | "accepted" | "rejected"
  submittedAt?: string
  evaluatedAt?: string
}

const statusStyles: Record<string, string> = {
  pending: "bg-ds-warning/20 text-ds-warning",
  evaluated: "bg-ds-accent/20 text-ds-accent-foreground",
  accepted: "bg-ds-success/20 text-ds-success",
  rejected: "bg-ds-destructive/20 text-ds-destructive",
}

const conditionStyles: Record<string, string> = {
  excellent: "bg-ds-success/20 text-ds-success",
  good: "bg-ds-primary/20 text-ds-primary",
  fair: "bg-ds-warning/20 text-ds-warning",
  poor: "bg-ds-destructive/20 text-ds-destructive",
}

export function TradeInItemCard({
  item,
  locale,
  onViewDetails,
}: {
  item: TradeInItem
  locale: string
  onViewDetails?: (id: string) => void
}) {
  return (
    <div className="bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:border-ds-ring transition-colors">
      <div className="flex gap-4 p-4">
        <div className="w-20 h-20 rounded-lg bg-ds-muted overflow-hidden flex-shrink-0">
          {item.thumbnail ? (
            <img loading="lazy" src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8 text-ds-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-ds-foreground truncate">{item.title}</h3>
            <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${statusStyles[item.status]}`}>
              {t(locale, `recommerce.status_${item.status}`)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${conditionStyles[item.condition]}`}>
              {t(locale, `recommerce.${item.condition}`)}
            </span>
            <span className="text-sm font-semibold text-ds-foreground">
              {formatCurrency((item.estimatedValue.amount ?? 0), item.estimatedValue.currencyCode, locale as SupportedLocale)}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-ds-muted-foreground">
            {item.submittedAt && (
              <span>{t(locale, "recommerce.submitted")}: {formatDate(item.submittedAt, locale as SupportedLocale)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => onViewDetails?.(item.id)}
          className="w-full px-4 py-2 text-sm font-medium rounded-lg border border-ds-border text-ds-foreground hover:bg-ds-muted transition-colors"
        >
          {t(locale, "blocks.view_details")}
        </button>
      </div>
    </div>
  )
}
