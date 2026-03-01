import { t, formatCurrency } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/i18n"

export interface TrialItem {
  id: string
  title: string
  thumbnail?: string
  price: { amount: number; currencyCode: string }
  sizes?: string[]
  colors?: string[]
}

export function TrialItemSelector({
  items,
  selectedItems,
  maxItems,
  locale,
  onToggle,
  onConfirm,
}: {
  items: TrialItem[]
  selectedItems: string[]
  maxItems?: number
  locale: string
  onToggle?: (itemId: string) => void
  onConfirm?: (itemIds: string[]) => void
}) {
  const canSelectMore = !maxItems || selectedItems.length < maxItems

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ds-foreground">
          {t(locale, "tbyb.select_items")}
        </h3>
        {maxItems && (
          <span className="text-sm text-ds-muted-foreground">
            {selectedItems.length}/{maxItems} {t(locale, "tbyb.selected")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const isSelected = selectedItems.includes(item.id)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle?.(item.id)}
              disabled={!isSelected && !canSelectMore}
              className={`relative rounded-xl border-2 overflow-hidden text-start transition-colors ${
                isSelected
                  ? "border-ds-primary ring-2 ring-ds-primary/20"
                  : "border-ds-border hover:border-ds-ring disabled:opacity-50"
              }`}
            >
              <div className="aspect-square bg-ds-muted overflow-hidden">
                {item.thumbnail ? (
                  <img loading="lazy" src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-ds-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="p-3 space-y-1">
                <p className="text-sm font-medium text-ds-foreground truncate">{item.title}</p>
                <p className="text-sm font-semibold text-ds-foreground">
                  {formatCurrency((item.price.amount ?? 0), item.price.currencyCode, locale as SupportedLocale)}
                </p>
                {item.sizes && item.sizes.length > 0 && (
                  <p className="text-xs text-ds-muted-foreground">
                    {t(locale, "tbyb.sizes")}: {item.sizes.join(", ")}
                  </p>
                )}
              </div>

              {isSelected && (
                <div className="absolute top-2 end-2 w-6 h-6 rounded-full bg-ds-primary text-ds-primary-foreground flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {selectedItems.length > 0 && (
        <button
          type="button"
          onClick={() => onConfirm?.(selectedItems)}
          className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90 transition-colors"
        >
          {t(locale, "tbyb.confirm_selection")} ({selectedItems.length})
        </button>
      )}
    </div>
  )
}
