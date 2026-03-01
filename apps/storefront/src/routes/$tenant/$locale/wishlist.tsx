import { createFileRoute, Link } from "@tanstack/react-router"
import { t } from "@/lib/i18n"
import { useWishlist } from "@/lib/hooks/use-campaigns"
import { WishlistGrid } from "@/components/campaigns/wishlist-grid"

export const Route = createFileRoute("/$tenant/$locale/wishlist")({
  component: WishlistPage,
  head: () => ({
    meta: [
      { title: "Wishlist | Dakkah CityOS" },
      { name: "description", content: "Your wishlist on Dakkah CityOS" },
    ],
  }),
})

function WishlistPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const { data: items, isLoading } = useWishlist()

  const handleRemove = (_itemId: string) => {}

  const handleMoveToCart = (_itemId: string) => {}

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground mb-4">
            <Link
              to={`${prefix}` as never}
              className="hover:text-ds-foreground transition-colors"
            >
              {t(locale, "common.home")}
            </Link>
            <span>/</span>
            <span className="text-ds-foreground">Wishlist</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-ds-foreground">
                My Wishlist
              </h1>
              <p className="mt-2 text-ds-muted-foreground">
                {items?.length
                  ? `${items.length} saved items`
                  : "Your saved items will appear here"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WishlistGrid
          items={items || []}
          onRemove={handleRemove}
          onMoveToCart={handleMoveToCart}
          loading={isLoading}
        />
      </div>
    </div>
  )
}
