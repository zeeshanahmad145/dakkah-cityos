import { Link } from "@tanstack/react-router"
import { formatPrice } from "@/lib/utils/price"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface CartItem {
  id: string
  title: string
  thumbnail?: string
  quantity: number
  unit_price: number
  variant?: { title?: string }
}

interface CartVendorGroupProps {
  vendorId: string
  vendorName: string
  vendorHandle: string
  items: CartItem[]
  currencyCode: string
  onUpdateQuantity?: (itemId: string, quantity: number) => void
  onRemoveItem?: (itemId: string) => void
}

export function CartVendorGroup({
  vendorId,
  vendorName,
  vendorHandle,
  items,
  currencyCode,
  onUpdateQuantity,
  onRemoveItem,
}: CartVendorGroupProps) {
  const prefix = useTenantPrefix()
  const subtotal = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  )

  return (
    <div className="bg-ds-background rounded-xl border border-ds-border overflow-hidden">
      {/* Vendor Header */}
      <div className="px-6 py-4 border-b border-ds-border bg-ds-muted">
        <div className="flex items-center justify-between">
          <Link
            to={`${prefix}/vendors/${vendorHandle}` as never}
            className="font-semibold text-ds-foreground hover:text-ds-muted-foreground transition-colors"
          >
            {vendorName}
          </Link>
          <span className="text-sm text-ds-muted-foreground">
            {items.length} items
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-ds-border">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 p-6">
            <div className="w-16 h-16 rounded-lg bg-ds-muted overflow-hidden flex-shrink-0">
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ds-muted-foreground text-xs">
                  No image
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-ds-foreground truncate">
                {item.title}
              </h4>
              {item.variant?.title && (
                <p className="text-sm text-ds-muted-foreground">
                  {item.variant.title}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center border border-ds-border rounded-lg">
                  <button
                    onClick={() =>
                      onUpdateQuantity?.(
                        item.id,
                        Math.max(1, item.quantity - 1),
                      )
                    }
                    className="px-3 py-1 text-ds-muted-foreground hover:bg-ds-muted"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-sm">{item.quantity}</span>
                  <button
                    onClick={() =>
                      onUpdateQuantity?.(item.id, item.quantity + 1)
                    }
                    className="px-3 py-1 text-ds-muted-foreground hover:bg-ds-muted"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => onRemoveItem?.(item.id)}
                  className="text-sm text-ds-destructive hover:text-ds-destructive"
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="font-semibold text-ds-foreground">
              {formatPrice(item.unit_price * item.quantity, currencyCode)}
            </p>
          </div>
        ))}
      </div>

      {/* Vendor Subtotal */}
      <div className="px-6 py-4 border-t border-ds-border bg-ds-muted">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ds-muted-foreground">
            Subtotal from {vendorName}
          </span>
          <span className="font-semibold text-ds-foreground">
            {formatPrice(subtotal, currencyCode)}
          </span>
        </div>
      </div>
    </div>
  )
}
