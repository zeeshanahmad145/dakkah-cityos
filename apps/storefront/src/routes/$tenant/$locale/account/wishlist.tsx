import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { WishlistGrid } from "@/components/wishlist/wishlist-grid"
import { WishlistShare } from "@/components/wishlist/wishlist-share"
import { t, type SupportedLocale } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/account/wishlist")({
  component: WishlistPage,
})

const demoItems = [
  { id: "1", productId: "p1", name: "Wireless Bluetooth Headphones", price: 79.99, originalPrice: 129.99, currency: "USD", image: "", inStock: true, addedAt: "2025-12-01" },
  { id: "2", productId: "p2", name: "Organic Cotton T-Shirt", price: 34.99, currency: "USD", image: "", inStock: true, addedAt: "2025-12-05" },
  { id: "3", productId: "p3", name: "Stainless Steel Water Bottle", price: 24.99, currency: "USD", image: "", inStock: false, addedAt: "2025-11-28" },
  { id: "4", productId: "p4", name: "Leather Crossbody Bag", price: 89.99, originalPrice: 119.99, currency: "USD", image: "", inStock: true, addedAt: "2025-12-10" },
]

function WishlistPage() {
  const { locale, tenant } = Route.useParams() as { tenant: string; locale: string }
  const [items, setItems] = useState(demoItems)
  const [showShare, setShowShare] = useState(false)

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId))
  }

  return (
    <AccountLayout
      title={t(locale, "wishlist.title")}
      description={t(locale, "wishlist.my_wishlists")}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShowShare(!showShare)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-ds-border text-sm text-ds-foreground hover:bg-ds-muted transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {t(locale, "wishlist.share_wishlist")}
          </button>
        </div>

        {showShare && (
          <WishlistShare
            locale={locale}
            wishlistId="default"
            wishlistName={t(locale, "wishlist.default_wishlist")}
            onClose={() => setShowShare(false)}
          />
        )}

        <WishlistGrid
          locale={locale}
          items={items}
          onRemoveItem={handleRemoveItem}
          onMoveToCart={(itemId) => {
            setItems(items.filter((i) => i.id !== itemId))
          }}
        />
      </div>
    </AccountLayout>
  )
}
