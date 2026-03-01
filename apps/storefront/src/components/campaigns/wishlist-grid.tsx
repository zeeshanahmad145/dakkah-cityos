import { Link } from "@tanstack/react-router"
import { useTenantPrefix, useLocale } from "@/lib/context/tenant-context"
import { formatCurrency, type SupportedLocale } from "@/lib/i18n"
import type { WishlistItem } from "@/lib/hooks/use-campaigns"

interface WishlistGridProps {
  items: WishlistItem[]
  onRemove?: (itemId: string) => void
  onMoveToCart?: (itemId: string) => void
  loading?: boolean
}

export function WishlistGrid({
  items,
  onRemove,
  onMoveToCart,
  loading,
}: WishlistGridProps) {
  const prefix = useTenantPrefix()
  const { locale } = useLocale()

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="aspect-[3/4] bg-ds-muted rounded-lg animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
        <svg
          className="w-12 h-12 text-ds-muted-foreground mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <p className="text-ds-muted-foreground">Your wishlist is empty</p>
        <p className="text-sm text-ds-muted-foreground mt-1">
          Save items you love to find them later
        </p>
        <Link
          to={`${prefix}/products` as never}
          className="inline-block mt-4 px-6 py-2 bg-ds-primary text-ds-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-ds-background rounded-lg border border-ds-border overflow-hidden group"
        >
          <Link to={`${prefix}/products/${item.product_id}` as never}>
            <div className="aspect-square bg-ds-muted relative overflow-hidden">
              {item.thumbnail ? (
                <img
                  loading="lazy"
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ds-muted-foreground">
                  <svg
                    className="w-12 h-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onRemove(item.id)
                  }}
                  className="absolute top-2 end-2 p-1.5 bg-ds-background/90 rounded-full hover:bg-ds-destructive/10 transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-ds-muted-foreground hover:text-ds-destructive"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              {!item.in_stock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-ds-background text-ds-foreground text-sm font-medium px-3 py-1 rounded">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
          </Link>

          <div className="p-4">
            <h3 className="font-semibold text-ds-foreground line-clamp-2">
              {item.title}
            </h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-bold text-ds-foreground">
                {formatCurrency(
                  item.price,
                  item.currency_code,
                  locale as SupportedLocale,
                )}
              </span>
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${item.in_stock ? "bg-ds-success/10 text-ds-success" : "bg-ds-muted text-ds-muted-foreground"}`}
              >
                {item.in_stock ? "In Stock" : "Out of Stock"}
              </span>
            </div>
            {onMoveToCart && item.in_stock && (
              <button
                onClick={() => onMoveToCart(item.id)}
                className="w-full mt-3 px-4 py-2 bg-ds-primary text-ds-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Move to Cart
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
