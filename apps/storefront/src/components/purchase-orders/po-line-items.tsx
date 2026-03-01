import { PurchaseOrderItem } from "@/lib/hooks/use-purchase-orders"
import { formatPrice } from "@/lib/utils/price"

interface POLineItemsProps {
  items: PurchaseOrderItem[]
  currencyCode: string
  editable?: boolean
  onUpdateQuantity?: (itemId: string, quantity: number) => void
  onRemoveItem?: (itemId: string) => void
}

export function POLineItems({
  items,
  currencyCode,
  editable = false,
  onUpdateQuantity,
  onRemoveItem,
}: POLineItemsProps) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-ds-background rounded-xl border border-ds-border p-8 text-center">
        <p className="text-ds-muted-foreground">No items in this purchase order</p>
      </div>
    )
  }

  return (
    <div className="bg-ds-background rounded-xl border border-ds-border overflow-hidden">
      <div className="px-6 py-4 border-b border-ds-border">
        <h3 className="text-lg font-semibold text-ds-foreground">
          Line Items ({items.length})
        </h3>
      </div>

      <div className="divide-y divide-ds-border">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-6">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-ds-foreground">{((item as any).product_title || item.title)}</h4>
              {(item as any).variant_title && (
                <p className="text-sm text-ds-muted-foreground">{(item as any).variant_title}</p>
              )}
              <p className="text-sm text-ds-muted-foreground mt-1">
                {formatPrice((item.unit_price ?? 0), currencyCode)} each
              </p>
            </div>

            <div className="flex items-center gap-6">
              {editable ? (
                <div className="flex items-center border border-ds-border rounded-lg">
                  <button
                    onClick={() =>
                      onUpdateQuantity?.(item.id, Math.max(1, item.quantity - 1))
                    }
                    className="px-3 py-1 text-ds-muted-foreground hover:bg-ds-muted"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
                    className="px-3 py-1 text-ds-muted-foreground hover:bg-ds-muted"
                  >
                    +
                  </button>
                </div>
              ) : (
                <span className="text-sm text-ds-muted-foreground">Qty: {item.quantity}</span>
              )}

              <div className="text-end min-w-[100px]">
                <p className="font-semibold text-ds-foreground">
                  {formatPrice(item.total ?? 0, currencyCode)}
                </p>
              </div>

              {editable && onRemoveItem && (
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-sm text-ds-destructive hover:text-ds-destructive"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="px-6 py-4 bg-ds-muted border-t border-ds-border">
        <div className="flex justify-between">
          <span className="font-medium text-ds-foreground">Items Total</span>
          <span className="font-semibold text-ds-foreground">
            {formatPrice(
              items.reduce((sum, item) => (sum + (item.total ?? 0)), 0),
              currencyCode
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
