import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { t, formatCurrency, type SupportedLocale } from "@/lib/i18n"
import { useTenant, useTenantPrefix } from "@/lib/context/tenant-context"
import { AddToWishlistButton } from "./add-to-wishlist-button"

interface WishlistItem {
  id: string
  productId: string
  name: string
  price: number
  originalPrice?: number
  currency?: string
  image?: string
  inStock: boolean
  addedAt: string
}

type ViewMode = "grid" | "list"
type SortOption = "date_added" | "price_low" | "price_high" | "name"

interface WishlistGridProps {
  locale?: string
  items: WishlistItem[]
  onRemoveItem?: (itemId: string) => void
  onMoveToCart?: (itemId: string) => void
}

export function WishlistGrid({
  locale: localeProp,
  items,
  onRemoveItem,
  onMoveToCart,
}: WishlistGridProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const prefix = useTenantPrefix()
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sortBy, setSortBy] = useState<SortOption>("date_added")

  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case "price_low":
        return a.price - b.price
      case "price_high":
        return b.price - a.price
      case "name":
        return a.name.localeCompare(b.name)
      default:
        return new Date(b.addedAt!).getTime() - new Date(a.addedAt!).getTime()
    }
  })

  if (items.length === 0) {
    return (
      <div className="bg-ds-card rounded-lg border border-ds-border p-12 text-center">
        <p className="text-4xl mb-4">💝</p>
        <h3 className="text-lg font-semibold text-ds-foreground mb-2">
          {t(locale, "wishlist.empty_wishlist")}
        </h3>
        <p className="text-sm text-ds-muted-foreground mb-4">
          {t(locale, "wishlist.empty_wishlist_desc")}
        </p>
        <Link
          to={`${prefix}/` as never}
          className="inline-block px-4 py-2 bg-ds-primary text-ds-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          {t(locale, "wishlist.browse_products")}
        </Link>
      </div>
    )
  }

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "date_added", label: t(locale, "wishlist.sort_date_added") },
    { value: "price_low", label: t(locale, "wishlist.sort_price_low") },
    { value: "price_high", label: t(locale, "wishlist.sort_price_high") },
    { value: "name", label: t(locale, "wishlist.sort_name") },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-ds-muted-foreground">
          {items.length} {t(locale, "wishlist.items_count")}
        </p>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 rounded-lg border border-ds-border bg-ds-card text-ds-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(locale, "wishlist.sort_by")}: {option.label}
              </option>
            ))}
          </select>
          <div className="flex items-center bg-ds-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-ds-card shadow-sm" : "text-ds-muted-foreground"}`}
              aria-label={t(locale, "wishlist.grid_view")}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-ds-card shadow-sm" : "text-ds-muted-foreground"}`}
              aria-label={t(locale, "wishlist.list_view")}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className="bg-ds-card rounded-lg border border-ds-border overflow-hidden group"
            >
              <div className="relative aspect-square bg-ds-muted">
                {item.image && (
                  <img
                    loading="lazy"
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 end-2">
                  <AddToWishlistButton
                    productId={item.productId}
                    isInWishlist={true}
                    onToggle={() => onRemoveItem?.(item.id)}
                    size="sm"
                    locale={locale}
                  />
                </div>
                {!item.inStock && (
                  <div className="absolute inset-0 bg-ds-background/60 flex items-center justify-center">
                    <span className="text-sm font-medium text-ds-destructive bg-ds-destructive/10 px-3 py-1 rounded-full">
                      {t(locale, "wishlist.out_of_stock")}
                    </span>
                  </div>
                )}
                {item.originalPrice && item.originalPrice > item.price && (
                  <div className="absolute top-2 start-2">
                    <span className="text-xs bg-ds-destructive text-white px-2 py-0.5 rounded-full font-medium">
                      {t(locale, "wishlist.price_dropped")}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-ds-foreground line-clamp-2">
                  {item.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold text-ds-primary">
                    {formatCurrency(
                      item.price,
                      item.currency,
                      locale as SupportedLocale,
                    )}
                  </span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <span className="text-xs text-ds-muted-foreground line-through">
                      {formatCurrency(
                        item.originalPrice,
                        item.currency,
                        locale as SupportedLocale,
                      )}
                    </span>
                  )}
                </div>
                {item.inStock && onMoveToCart && (
                  <button
                    onClick={() => onMoveToCart(item.id)}
                    className="mt-2 w-full py-1.5 text-xs font-medium bg-ds-primary text-ds-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                  >
                    {t(locale, "wishlist.move_to_cart")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 bg-ds-card rounded-lg border border-ds-border p-3"
            >
              <div className="relative w-20 h-20 rounded-lg bg-ds-muted overflow-hidden flex-shrink-0">
                {item.image && (
                  <img
                    loading="lazy"
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ds-foreground truncate">
                  {item.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold text-ds-primary">
                    {formatCurrency(
                      item.price,
                      item.currency,
                      locale as SupportedLocale,
                    )}
                  </span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <span className="text-xs text-ds-muted-foreground line-through">
                      {formatCurrency(
                        item.originalPrice,
                        item.currency,
                        locale as SupportedLocale,
                      )}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs mt-1 inline-block ${item.inStock ? "text-ds-success" : "text-ds-destructive"}`}
                >
                  {item.inStock
                    ? t(locale, "wishlist.in_stock")
                    : t(locale, "wishlist.out_of_stock")}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.inStock && onMoveToCart && (
                  <button
                    onClick={() => onMoveToCart(item.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-ds-primary text-ds-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                  >
                    {t(locale, "wishlist.move_to_cart")}
                  </button>
                )}
                <AddToWishlistButton
                  productId={item.productId}
                  isInWishlist={true}
                  onToggle={() => onRemoveItem?.(item.id)}
                  size="sm"
                  locale={locale}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
