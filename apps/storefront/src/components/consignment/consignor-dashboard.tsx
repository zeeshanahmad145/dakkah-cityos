import { t, formatCurrency } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/i18n"
import { ConsignmentItemCard, type ConsignmentItem } from "./consignment-item-card"

export function ConsignorDashboard({
  totalItems,
  listedItems,
  soldItems,
  totalEarnings,
  pendingPayout,
  items,
  locale,
}: {
  totalItems: number
  listedItems: number
  soldItems: number
  totalEarnings: { amount: number; currencyCode: string }
  pendingPayout: { amount: number; currencyCode: string }
  items: ConsignmentItem[]
  locale: string
}) {
  const stats = [
    { label: "consignment.total_items", value: totalItems.toString() },
    { label: "consignment.listed_items", value: listedItems.toString() },
    { label: "consignment.sold_items", value: soldItems.toString() },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-ds-foreground">
        {t(locale, "consignment.dashboard")}
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-ds-foreground">{stat.value}</p>
            <p className="text-xs text-ds-muted-foreground mt-1">{t(locale, stat.label)}</p>
          </div>
        ))}
        <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-ds-success">
            {formatCurrency((totalEarnings.amount ?? 0), totalEarnings.currencyCode, locale as SupportedLocale)}
          </p>
          <p className="text-xs text-ds-muted-foreground mt-1">{t(locale, "consignment.total_earnings")}</p>
        </div>
        <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-ds-warning">
            {formatCurrency((pendingPayout.amount ?? 0), pendingPayout.currencyCode, locale as SupportedLocale)}
          </p>
          <p className="text-xs text-ds-muted-foreground mt-1">{t(locale, "consignment.pending_payout")}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-ds-foreground mb-4">
          {t(locale, "consignment.your_items")}
        </h3>
        {items.length === 0 ? (
          <div className="bg-ds-background border border-ds-border rounded-xl p-8 text-center">
            <p className="text-ds-muted-foreground">{t(locale, "consignment.no_items")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((item) => (
              <ConsignmentItemCard key={item.id} item={item} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
