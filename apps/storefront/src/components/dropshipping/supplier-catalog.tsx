import { t, formatCurrency } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/i18n"
import type { SupplierProduct } from "@/lib/hooks/use-dropshipping"

export function SupplierCatalog({
  products,
  locale,
  onAddToStore,
}: {
  products: SupplierProduct[]
  locale: string
  onAddToStore?: (productId: string) => void
}) {
  if (!products || products.length === 0) {
    return (
      <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
        <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3 className="text-lg font-semibold text-ds-foreground mb-2">
          {t(locale, "dropshipping.no_products")}
        </h3>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:border-ds-ring transition-colors"
        >
          <div className="relative aspect-[4/3] bg-ds-muted overflow-hidden">
            {product.thumbnail ? (
              <img
                src={product.thumbnail}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-12 h-12 text-ds-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {product.inStock === false && (
              <span className="absolute top-2 start-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-ds-destructive/20 text-ds-destructive">
                {t(locale, "dropshipping.out_of_stock")}
              </span>
            )}
          </div>

          <div className="p-4 space-y-3">
            <h3 className="font-semibold text-ds-foreground line-clamp-2">{product.title}</h3>

            <p className="text-xs text-ds-muted-foreground">{product.supplierName}</p>

            <div className="flex items-baseline gap-3">
              <div>
                <p className="text-xs text-ds-muted-foreground">{t(locale, "dropshipping.wholesale")}</p>
                <p className="text-lg font-bold text-ds-foreground">
                  {formatCurrency((product.wholesalePrice.amount ?? 0), product.wholesalePrice.currencyCode, locale as SupportedLocale)}
                </p>
              </div>
              <div>
                <p className="text-xs text-ds-muted-foreground">{t(locale, "dropshipping.retail")}</p>
                <p className="text-sm text-ds-muted-foreground">
                  {formatCurrency((product.retailPrice.amount ?? 0), product.retailPrice.currencyCode, locale as SupportedLocale)}
                </p>
              </div>
            </div>

            {product.margin != null && (
              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-ds-success/10 text-ds-success rounded-full">
                {product.margin}% {t(locale, "dropshipping.margin")}
              </span>
            )}

            <div className="flex flex-wrap gap-2 text-xs text-ds-muted-foreground">
              {product.moq != null && (
                <span>{t(locale, "dropshipping.moq")}: {product.moq}</span>
              )}
              {product.shippingTime && (
                <span>{t(locale, "dropshipping.shipping_time")}: {product.shippingTime}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onAddToStore?.(product.id)}
              disabled={product.inStock === false}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90 transition-colors disabled:opacity-50"
            >
              {t(locale, "dropshipping.add_to_store")}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
