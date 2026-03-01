import { t, formatCurrency, type SupportedLocale } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"

interface PricingTier {
  minQuantity: number
  maxQuantity?: number
  unitPrice: number
  discountPercent: number
}

interface TierPricingTableProps {
  locale?: string
  tiers: PricingTier[]
  currency?: string
  basePrice: number
  selectedQuantity?: number
  onSelectTier?: (tier: PricingTier) => void
}

export function TierPricingTable({
  locale: localeProp,
  tiers,
  currency = "USD",
  basePrice,
  selectedQuantity,
  onSelectTier,
}: TierPricingTableProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"

  const bestValueIdx = tiers.reduce((best, tier, idx) => {
    return tier.discountPercent > (tiers[best]?.discountPercent || 0) ? idx : best
  }, 0)

  return (
    <div className="bg-ds-card rounded-lg border border-ds-border overflow-hidden">
      <div className="p-4 border-b border-ds-border">
        <h3 className="font-semibold text-ds-foreground">
          {t(locale, "wholesale.tier_pricing")}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ds-border bg-ds-muted/50">
              <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted-foreground uppercase tracking-wider">
                {t(locale, "wholesale.quantity")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted-foreground uppercase tracking-wider">
                {t(locale, "wholesale.unit_price")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted-foreground uppercase tracking-wider">
                {t(locale, "wholesale.discount")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted-foreground uppercase tracking-wider">
                {t(locale, "wholesale.you_save")}
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, idx) => {
              const isSelected = selectedQuantity !== undefined &&
                selectedQuantity >= tier.minQuantity &&
                (!tier.maxQuantity || selectedQuantity <= tier.maxQuantity)
              const savings = (basePrice - tier.unitPrice) * tier.minQuantity

              return (
                <tr
                  key={idx}
                  className={`border-b border-ds-border last:border-b-0 transition-colors ${
                    isSelected ? "bg-ds-primary/5" : "hover:bg-ds-muted/30"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ds-foreground">
                        {tier.minQuantity}{tier.maxQuantity ? `-${tier.maxQuantity}` : "+"} {t(locale, "wholesale.units")}
                      </span>
                      {idx === bestValueIdx && (
                        <span className="text-xs bg-ds-success/10 text-ds-success px-2 py-0.5 rounded-full font-medium">
                          {t(locale, "wholesale.best_value")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-ds-foreground">
                      {formatCurrency((tier.unitPrice ?? 0), currency, locale as SupportedLocale)}
                    </span>
                    <span className="text-xs text-ds-muted-foreground ms-1">
                      {t(locale, "wholesale.price_per_unit")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${tier.discountPercent > 0 ? "text-ds-success" : "text-ds-muted-foreground"}`}>
                      {tier.discountPercent > 0 ? `-${tier.discountPercent}%` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-ds-success font-medium">
                      {savings > 0 ? formatCurrency(savings, currency, locale as SupportedLocale) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    {onSelectTier && (
                      <button
                        onClick={() => onSelectTier(tier)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-ds-primary text-ds-primary-foreground"
                            : "bg-ds-muted text-ds-foreground hover:bg-ds-primary/10"
                        }`}
                      >
                        {t(locale, "wholesale.select_quantity")}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
