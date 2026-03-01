import { t, formatCurrency } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/i18n"

interface PricingRow {
  amount: number
  currencyCode: string
}

interface RentalPricingTableProps {
  locale: string
  daily: PricingRow
  weekly?: PricingRow
  monthly?: PricingRow
  deposit?: PricingRow
  insurance?: PricingRow
  selectedDays?: number
}

export function RentalPricingTable({
  locale,
  daily,
  weekly,
  monthly,
  deposit,
  insurance,
  selectedDays,
}: RentalPricingTableProps) {
  const loc = locale as SupportedLocale

  const rows: { label: string; value: string; highlight?: boolean }[] = [
    {
      label: t(locale, "rental.per_day"),
      value: formatCurrency((daily.amount ?? 0), daily.currencyCode, loc),
    },
  ]

  if (weekly) {
    rows.push({
      label: t(locale, "rental.per_week"),
      value: formatCurrency((weekly.amount ?? 0), weekly.currencyCode, loc),
    })
  }

  if (monthly) {
    rows.push({
      label: t(locale, "rental.per_month"),
      value: formatCurrency((monthly.amount ?? 0), monthly.currencyCode, loc),
    })
  }

  if (deposit) {
    rows.push({
      label: t(locale, "rental.deposit"),
      value: formatCurrency((deposit.amount ?? 0), deposit.currencyCode, loc),
    })
  }

  if (insurance) {
    rows.push({
      label: t(locale, "rental.insurance"),
      value: formatCurrency((insurance.amount ?? 0), insurance.currencyCode, loc),
    })
  }

  if (selectedDays && selectedDays > 0) {
    let totalRate = daily.amount * selectedDays
    if (monthly && selectedDays >= 30) {
      totalRate = monthly.amount * Math.floor(selectedDays / 30) + daily.amount * (selectedDays % 30)
    } else if (weekly && selectedDays >= 7) {
      totalRate = weekly.amount * Math.floor(selectedDays / 7) + daily.amount * (selectedDays % 7)
    }
    const total = totalRate + (deposit?.amount || 0) + (insurance?.amount || 0)
    rows.push({
      label: `${t(locale, "rental.rental_period")} (${selectedDays}d)`,
      value: formatCurrency(total, daily.currencyCode, loc),
      highlight: true,
    })
  }

  return (
    <div className="bg-ds-background border border-ds-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-ds-muted border-b border-ds-border">
        <h3 className="text-sm font-semibold text-ds-foreground">
          {t(locale, "blocks.view_pricing")}
        </h3>
      </div>
      <div className="divide-y divide-ds-border">
        {rows.map((row, i) => (
          <div
            key={i}
            className={`flex items-center justify-between px-4 py-3 ${
              row.highlight ? "bg-ds-primary/5" : ""
            }`}
          >
            <span
              className={`text-sm ${
                row.highlight
                  ? "font-semibold text-ds-foreground"
                  : "text-ds-muted-foreground"
              }`}
            >
              {row.label}
            </span>
            <span
              className={`text-sm font-medium ${
                row.highlight ? "text-ds-primary font-bold" : "text-ds-foreground"
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
