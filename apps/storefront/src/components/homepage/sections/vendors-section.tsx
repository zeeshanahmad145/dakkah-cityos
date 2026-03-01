import { Link } from "@tanstack/react-router"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface Vendor {
  id: string
  name: string
  handle: string
  logo?: string
  description?: string
  product_count?: number
}

interface VendorsSectionProps {
  vendors: Vendor[]
  config: Record<string, any>
}

export function VendorsSection({ vendors, config }: VendorsSectionProps) {
  const prefix = useTenantPrefix()
  if (vendors.length === 0) return null

  return (
    <section className="py-16 bg-ds-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">
              {config.title || "Featured Vendors"}
            </h2>
            <p className="mt-2 text-ds-muted-foreground">
              {config.subtitle || "Shop from our trusted marketplace sellers"}
            </p>
          </div>
          <Link
            to={`${prefix}/vendors` as never}
            className="text-sm font-medium text-ds-muted-foreground hover:text-ds-foreground"
          >
            View All Vendors
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              to={`${prefix}/vendors/${vendor.handle}` as never}
              className="group border border-ds-border rounded-lg p-6 hover:border-ds-border hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                {vendor.logo ? (
                  <img
                    src={vendor.logo}
                    alt={vendor.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-ds-muted flex items-center justify-center">
                    <span className="text-2xl font-bold text-ds-muted-foreground">
                      {vendor.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-ds-foreground group-hover:text-ds-muted-foreground">
                    {vendor.name}
                  </h3>
                  {vendor.product_count !== undefined && (
                    <p className="text-sm text-ds-muted-foreground">
                      {vendor.product_count} products
                    </p>
                  )}
                </div>
              </div>
              {vendor.description && (
                <p className="text-sm text-ds-muted-foreground line-clamp-2">
                  {vendor.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
