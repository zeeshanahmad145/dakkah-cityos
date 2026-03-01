import { useState } from "react"
import { useLocale } from "@/lib/context/tenant-context"
import { formatCurrency, type SupportedLocale } from "@/lib/i18n"
import type { Bundle, BundleItem } from "@/lib/hooks/use-campaigns"

interface BundleBuilderProps {
  bundle: Bundle
  onAddToCart?: (selectedItemIds: string[]) => void
}

export function BundleBuilder({ bundle, onAddToCart }: BundleBuilderProps) {
  const { locale } = useLocale()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    ;(bundle.items || []).forEach((item) => {
      if (item.required) initial.add(item.id)
    })
    return initial
  })

  const handleToggle = (itemId: string, required: boolean) => {
    if (required) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const selectedItems = (bundle.items || []).filter((item) => selectedIds.has(item.id))
  const individualTotal = selectedItems.reduce((sum, item) => sum + item.price, 0)
  const savings = individualTotal - bundle.total_price
  const savingsPercent = individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0

  return (
    <div className="bg-ds-background rounded-lg border border-ds-border overflow-hidden">
      {bundle.thumbnail && (
        <div className="aspect-video bg-ds-muted overflow-hidden">
          <img loading="lazy" src={bundle.thumbnail} alt={bundle.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-6">
        <h3 className="text-xl font-bold text-ds-foreground">{bundle.title}</h3>
        {bundle.description && (
          <p className="text-sm text-ds-muted-foreground mt-2">{bundle.description}</p>
        )}

        <div className="mt-6 space-y-3">
          {(bundle.items || []).map((item) => (
            <BundleItemRow
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              onToggle={() => handleToggle(item.id, item.required)}
              locale={locale}
            />
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-ds-border space-y-2">
          {savings > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-ds-muted-foreground">Individual total</span>
              <span className="text-ds-muted-foreground line-through">
                {formatCurrency(individualTotal, bundle.currency_code, locale as SupportedLocale)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-ds-foreground">Bundle Price</span>
            <span className="text-xl font-bold text-ds-foreground">
              {formatCurrency((bundle.total_price ?? 0), bundle.currency_code, locale as SupportedLocale)}
            </span>
          </div>
          {savings > 0 && (
            <div className="flex items-center justify-end">
              <span className="text-sm font-medium text-ds-success">
                Save {formatCurrency(savings, bundle.currency_code, locale as SupportedLocale)} ({savingsPercent}%)
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => onAddToCart?.(Array.from(selectedIds))}
          className="w-full mt-6 px-4 py-3 bg-ds-primary text-ds-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          Add Bundle to Cart
        </button>
      </div>
    </div>
  )
}

function BundleItemRow({
  item,
  selected,
  onToggle,
  locale,
}: {
  item: BundleItem
  selected: boolean
  onToggle: () => void
  locale: string
}) {
  return (
    <label
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
        selected ? "border-ds-primary bg-ds-primary/5" : "border-ds-border bg-ds-background"
      } ${item.required ? "cursor-default" : ""}`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        disabled={item.required}
        className="w-4 h-4 rounded border-ds-border text-ds-primary focus:ring-ds-primary"
      />
      <div className="w-10 h-10 rounded bg-ds-muted overflow-hidden flex-shrink-0">
        {item.thumbnail ? (
          <img loading="lazy" src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-ds-muted-foreground">
            {item.title.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ds-foreground">{item.title}</span>
          {item.required && (
            <span className="text-xs text-ds-muted-foreground bg-ds-muted px-1.5 py-0.5 rounded">Required</span>
          )}
        </div>
      </div>
      <span className="text-sm font-medium text-ds-muted-foreground">
        {formatCurrency((item.price ?? 0), item.currency_code, locale as SupportedLocale)}
      </span>
    </label>
  )
}
