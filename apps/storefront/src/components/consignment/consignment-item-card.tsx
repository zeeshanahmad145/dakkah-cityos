import { t, formatCurrency, formatDate } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/i18n"

export interface ConsignmentItem {
  id: string
  title: string
  thumbnail?: string
  askingPrice: { amount: number; currencyCode: string }
  commission: number
  status: "pending" | "listed" | "sold" | "returned"
  listedAt?: string
  soldAt?: string
  consignorName?: string
}

const statusStyles: Record<string, string> = {
  pending: "bg-ds-warning/20 text-ds-warning",
  listed: "bg-ds-success/20 text-ds-success",
  sold: "bg-ds-primary/20 text-ds-primary",
  returned: "bg-ds-muted text-ds-muted-foreground",
}

export function ConsignmentItemCard({
  item,
  locale,
}: {
  item: ConsignmentItem
  locale: string
}) {
  return (
    <div className="bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:border-ds-ring transition-colors">
      <div className="relative aspect-[4/3] bg-ds-muted overflow-hidden">
        {item.thumbnail ? (
          <img loading="lazy" src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-ds-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <span className={`absolute top-2 start-2 px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyles[item.status]}`}>
          {t(locale, `consignment.status_${item.status}`)}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-ds-foreground line-clamp-2">{item.title}</h3>

        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs text-ds-muted-foreground">{t(locale, "consignment.asking_price")}</p>
            <p className="text-lg font-bold text-ds-foreground">
              {formatCurrency((item.askingPrice.amount ?? 0), item.askingPrice.currencyCode, locale as SupportedLocale)}
            </p>
          </div>
          <div className="text-end">
            <p className="text-xs text-ds-muted-foreground">{t(locale, "consignment.commission")}</p>
            <p className="text-sm font-medium text-ds-foreground">{item.commission}%</p>
          </div>
        </div>

        {item.listedAt && (
          <p className="text-xs text-ds-muted-foreground">
            {t(locale, "consignment.listed")}: {formatDate(item.listedAt, locale as SupportedLocale)}
          </p>
        )}
      </div>
    </div>
  )
}
