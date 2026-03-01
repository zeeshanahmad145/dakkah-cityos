import { Link } from "@tanstack/react-router"
import { formatPrice } from "@/lib/utils/price"

interface Product {
  id: string
  title: string
  handle: string
  thumbnail?: string
  variants?: Array<{
    calculated_price?: {
      calculated_amount: number
      currency_code: string
    }
  }>
}

interface FeaturedProductsSectionProps {
  tenantPrefix: string
  products: Product[]
  config: Record<string, any>
}

export function FeaturedProductsSection({
  tenantPrefix,
  products,
  config,
}: FeaturedProductsSectionProps) {
  if (products.length === 0) return null

  return (
    <section className="py-16 bg-ds-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">
            {config.title || "Featured Products"}
          </h2>
          <Link
            to={`${tenantPrefix}/store` as never}
            className="text-sm font-medium text-ds-muted-foreground hover:text-ds-foreground"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const price = product.variants?.[0]?.calculated_price

            return (
              <Link
                key={product.id}
                to={`${tenantPrefix}/products/${product.handle}` as never}
                className="group"
              >
                <div className="aspect-square bg-ds-muted rounded-lg overflow-hidden mb-4">
                  {product.thumbnail ? (
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ds-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-ds-foreground group-hover:text-ds-muted-foreground transition-colors">
                  {product.title}
                </h3>
                {price && (
                  <p className="mt-1 text-ds-muted-foreground">
                    {formatPrice(price.calculated_amount, price.currency_code)}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
