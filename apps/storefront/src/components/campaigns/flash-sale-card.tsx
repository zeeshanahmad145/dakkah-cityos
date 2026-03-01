import { Link } from "@tanstack/react-router"
import { useTenantPrefix, useLocale } from "@/lib/context/tenant-context"
import { formatCurrency, type SupportedLocale } from "@/lib/i18n"
import { CountdownTimer } from "./countdown-timer"
import type { FlashSale } from "@/lib/hooks/use-campaigns"

interface FlashSaleCardProps {
  sale: FlashSale
}

export function FlashSaleCard({ sale }: FlashSaleCardProps) {
  const prefix = useTenantPrefix()
  const { locale } = useLocale()
  const quantityPercent = sale.quantity_total && sale.quantity_sold
    ? Math.round((sale.quantity_sold / sale.quantity_total) * 100)
    : 0

  return (
    <div className="bg-ds-background rounded-lg border border-ds-border overflow-hidden hover:shadow-md transition-all">
      <div className="aspect-square bg-ds-muted relative overflow-hidden">
        {sale.thumbnail ? (
          <img loading="lazy" src={sale.thumbnail} alt={sale.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-ds-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 end-2 bg-ds-destructive text-ds-destructive-foreground text-xs font-bold px-2 py-1 rounded">
          -{sale.discount_percentage}%
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-ds-foreground line-clamp-2">{sale.title}</h3>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg font-bold text-ds-destructive">
            {formatCurrency((sale.sale_price ?? 0), sale.currency_code, locale as SupportedLocale)}
          </span>
          <span className="text-sm text-ds-muted-foreground line-through">
            {formatCurrency((sale.original_price ?? 0), sale.currency_code, locale as SupportedLocale)}
          </span>
        </div>

        <div className="mt-3">
          <CountdownTimer endsAt={sale.ends_at} variant="compact" />
        </div>

        {sale.quantity_total && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-ds-muted-foreground mb-1">
              <span>{sale.quantity_sold || 0} sold</span>
              <span>{sale.quantity_total - (sale.quantity_sold || 0)} left</span>
            </div>
            <div className="w-full h-2 bg-ds-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-ds-destructive rounded-full transition-all"
                style={{ width: `${quantityPercent}%` }}
              />
            </div>
          </div>
        )}

        <button className="w-full mt-4 px-4 py-2 bg-ds-primary text-ds-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
          Add to Cart
        </button>
      </div>
    </div>
  )
}
