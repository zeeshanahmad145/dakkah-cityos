import { Link } from "@tanstack/react-router"
import { t } from "@/lib/i18n"
import { useTenant, useTenantPrefix } from "@/lib/context/tenant-context"

interface SpotlightProduct {
  id: string
  name: string
  price: number
  currency?: string
  image?: string
}

interface SpotlightVendor {
  id: string
  handle: string
  name: string
  logo?: string
  banner?: string
  description?: string
  rating: number
  reviewCount: number
  verified: boolean
  topProducts: SpotlightProduct[]
}

interface VendorSpotlightProps {
  locale?: string
  vendor: SpotlightVendor
}

export function VendorSpotlight({
  locale: localeProp,
  vendor,
}: VendorSpotlightProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const prefix = useTenantPrefix()

  const formatPrice = (price: number, currency = "USD") => {
    const localeMap: Record<string, string> = {
      en: "en-US",
      fr: "fr-FR",
      ar: "ar-SA",
    }
    return new Intl.NumberFormat(localeMap[locale] || "en-US", {
      style: "currency",
      currency,
    }).format(price)
  }

  return (
    <div className="bg-ds-card rounded-xl border border-ds-border overflow-hidden">
      <div className="relative h-32 bg-gradient-to-r from-ds-primary/20 to-ds-accent/20">
        {vendor.banner && (
          <img
            loading="lazy"
            src={vendor.banner}
            alt={`${vendor.name} banner`}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-3 start-3">
          <span className="bg-ds-warning text-ds-warning-foreground text-xs font-bold px-2.5 py-1 rounded-full">
            ⭐ {t(locale, "marketplace.featured_vendor")}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3 -mt-10 relative">
          <div className="w-16 h-16 rounded-lg bg-ds-card border-2 border-ds-border shadow-md overflow-hidden flex-shrink-0">
            {vendor.logo ? (
              <img
                loading="lazy"
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
          <div className="pt-8">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-ds-foreground">
                {vendor.name}
              </h3>
              {vendor.verified && (
                <svg
                  className="h-4 w-4 text-ds-info"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-ds-muted-foreground">
              <span className="flex items-center gap-1">
                <svg
                  className="h-3.5 w-3.5 text-ds-warning"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {vendor.rating.toFixed(1)}
              </span>
              <span>·</span>
              <span>
                {vendor.reviewCount} {t(locale, "marketplace.reviews_count")}
              </span>
            </div>
          </div>
        </div>

        {vendor.description && (
          <p className="text-sm text-ds-muted-foreground mt-3 line-clamp-2">
            {vendor.description}
          </p>
        )}

        {vendor.topProducts.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-ds-foreground mb-2">
              {t(locale, "marketplace.top_products")}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {vendor.topProducts.slice(0, 3).map((product) => (
                <div
                  key={product.id}
                  className="rounded-lg border border-ds-border overflow-hidden bg-ds-background"
                >
                  <div className="aspect-square bg-ds-muted">
                    {product.image && (
                      <img
                        loading="lazy"
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-ds-foreground line-clamp-1">
                      {product.name}
                    </p>
                    <p className="text-xs font-semibold text-ds-primary mt-0.5">
                      {formatPrice(product.price, product.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link
          to={`${prefix}/vendors/${vendor.handle}` as never}
          className="mt-4 block w-full text-center py-2 px-4 bg-ds-primary text-ds-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          {t(locale, "marketplace.visit_store")}
        </Link>
      </div>
    </div>
  )
}
