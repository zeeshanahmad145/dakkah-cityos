import { Link } from "@tanstack/react-router"
import { Star, ArrowRight } from "@medusajs/icons"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface FeaturedVendor {
  id: string
  name: string
  handle: string
  logo?: string
  tagline?: string
  rating?: number
  productCount: number
}

interface FeaturedVendorsProps {
  vendors: FeaturedVendor[]
  title?: string
}

export function FeaturedVendors({
  vendors,
  title = "Featured Sellers",
}: FeaturedVendorsProps) {
  const prefix = useTenantPrefix()
  if (vendors.length === 0) return null

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-ds-foreground">{title}</h2>
        <Link
          to={`${prefix}/vendors` as never}
          className="text-sm font-medium text-ds-muted-foreground hover:text-ds-foreground flex items-center gap-1"
        >
          View All Sellers
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {vendors.slice(0, 4).map((vendor) => (
          <Link
            key={vendor.id}
            to={`${prefix}/vendors/${vendor.handle}` as never}
            className="group bg-ds-background rounded-xl border border-ds-border p-6 text-center hover:border-ds-border hover:shadow-md transition-all"
          >
            {/* Logo */}
            <div className="w-20 h-20 rounded-full bg-ds-muted mx-auto mb-4 overflow-hidden">
              {vendor.logo ? (
                <img
                  src={vendor.logo}
                  alt={vendor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-ds-muted-foreground">
                  {vendor.name[0]}
                </div>
              )}
            </div>

            {/* Name */}
            <h3 className="font-semibold text-ds-foreground group-hover:text-ds-muted-foreground transition-colors">
              {vendor.name}
            </h3>

            {/* Tagline */}
            {vendor.tagline && (
              <p className="text-sm text-ds-muted-foreground mt-1 line-clamp-1">
                {vendor.tagline}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center justify-center gap-3 mt-3 text-sm">
              {vendor.rating && (
                <span className="flex items-center gap-1 text-ds-muted-foreground">
                  <Star className="w-4 h-4 text-ds-warning fill-ds-warning" />
                  {vendor.rating.toFixed(1)}
                </span>
              )}
              <span className="text-ds-muted-foreground">|</span>
              <span className="text-ds-muted-foreground">
                {vendor.productCount} products
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
