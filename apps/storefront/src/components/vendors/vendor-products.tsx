import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { formatPrice } from "@/lib/utils/price"
import { MagnifyingGlass } from "@medusajs/icons"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Product {
  id: string
  title: string
  handle: string
  thumbnail?: string
  price: number
  currency_code: string
  collection?: string
}

interface VendorProductsProps {
  products: Product[]
  tenantPrefix: string
  vendorHandle: string
}

export function VendorProducts({
  products,
  tenantPrefix,
  vendorHandle,
}: VendorProductsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "name":
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ds-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-ds-border px-3 py-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {/* Products Grid */}
      {sortedProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-ds-muted-foreground">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedProducts.map((product) => (
            <Link
              key={product.id}
              to={`${tenantPrefix}/products/${product.handle}` as never}
              className="group"
            >
              <div className="aspect-square rounded-xl bg-ds-muted overflow-hidden mb-3">
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
              <h4 className="font-medium text-ds-foreground truncate group-hover:text-ds-muted-foreground transition-colors">
                {product.title}
              </h4>
              <p className="text-ds-muted-foreground mt-1">
                {formatPrice(product.price, product.currency_code)}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Load More */}
      {products.length > 12 && (
        <div className="mt-8 text-center">
          <Button variant="outline">Load More Products</Button>
        </div>
      )}
    </div>
  )
}
