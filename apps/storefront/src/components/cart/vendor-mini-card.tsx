import { Link } from "@tanstack/react-router"
import { Star, ChevronRight } from "@medusajs/icons"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface VendorMiniCardProps {
  vendorId: string
  vendorName: string
  vendorHandle: string
  vendorLogo?: string
  rating?: number
}

export function VendorMiniCard({
  vendorId,
  vendorName,
  vendorHandle,
  vendorLogo,
  rating,
}: VendorMiniCardProps) {
  const prefix = useTenantPrefix()

  return (
    <Link
      to={`${prefix}/vendors/${vendorHandle}` as never}
      className="inline-flex items-center gap-3 px-3 py-2 bg-ds-muted rounded-lg hover:bg-ds-muted transition-colors"
    >
      <div className="w-8 h-8 rounded-full bg-ds-muted overflow-hidden flex-shrink-0">
        {vendorLogo ? (
          <img
            src={vendorLogo}
            alt={vendorName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ds-muted-foreground text-xs font-semibold">
            {vendorName[0]}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ds-foreground truncate">
          {vendorName}
        </p>
        {rating && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-ds-warning fill-ds-warning" />
            <span className="text-xs text-ds-muted-foreground">
              {rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-ds-muted-foreground flex-shrink-0" />
    </Link>
  )
}
