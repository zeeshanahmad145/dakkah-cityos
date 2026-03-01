import { Link } from "@tanstack/react-router"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { Star, CheckCircleSolid, MapPin } from "@medusajs/icons"
import type { Vendor } from "@/lib/hooks/use-vendors"

interface VendorCardProps {
  vendor: Vendor
}

export function VendorCard({ vendor }: VendorCardProps) {
  const prefix = useTenantPrefix()

  return (
    <Link
      to={`${prefix}/vendors/${vendor.handle}` as never}
      className="group bg-ds-background rounded-lg border border-ds-border overflow-hidden hover:border-ds-border hover:shadow-md transition-all"
    >
      {/* Banner */}
      <div className="h-24 bg-ds-muted relative">
        {vendor.banner && (
          <img
            src={vendor.banner}
            alt={vendor.name}
            className="w-full h-full object-cover"
          />
        )}
        {/* Logo */}
        <div className="absolute -bottom-8 start-4">
          <div className="w-16 h-16 rounded-lg bg-ds-background border-2 border-white shadow-md overflow-hidden">
            {vendor.logo ? (
              <img
                src={vendor.logo}
                alt={vendor.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-ds-muted flex items-center justify-center text-xl font-bold text-ds-muted-foreground">
                {vendor.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-10 pb-4 px-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-ds-foreground group-hover:text-ds-muted-foreground transition-colors">
            {vendor.name}
          </h3>
          {vendor.verified && (
            <CheckCircleSolid className="h-4 w-4 text-ds-info" />
          )}
        </div>

        {vendor.location && (
          <div className="flex items-center gap-1 mt-1 text-sm text-ds-muted-foreground">
            <MapPin className="h-3 w-3" />
            {vendor.location}
          </div>
        )}

        {vendor.description && (
          <p className="text-sm text-ds-muted-foreground mt-2 line-clamp-2">
            {vendor.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-ds-border">
          {vendor.rating !== undefined && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-ds-warning" />
              <span className="text-sm font-medium text-ds-foreground">
                {vendor.rating.toFixed(1)}
              </span>
              {vendor.review_count !== undefined && (
                <span className="text-sm text-ds-muted-foreground">
                  ({vendor.review_count})
                </span>
              )}
            </div>
          )}
          {vendor.product_count !== undefined && (
            <span className="text-sm text-ds-muted-foreground">
              {vendor.product_count} products
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
