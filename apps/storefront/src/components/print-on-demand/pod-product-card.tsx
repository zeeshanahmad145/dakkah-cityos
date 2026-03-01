import { t, formatCurrency } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/i18n"

export interface PODProduct {
  id: string
  title: string
  thumbnail?: string
  basePrice: { amount: number; currencyCode: string }
  category?: string
  printAreas?: number
  colors?: number
  sizes?: string[]
}

export function PODProductCard({
  product,
  locale,
  onDesign,
}: {
  product: PODProduct
  locale: string
  onDesign?: (id: string) => void
}) {
  return (
    <div className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:border-ds-ring transition-colors">
      <div className="relative aspect-[4/3] bg-ds-muted overflow-hidden">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-ds-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {product.category && (
          <span className="absolute top-2 start-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-ds-background/80 text-ds-foreground backdrop-blur-sm">
            {product.category}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-ds-foreground line-clamp-2 group-hover:text-ds-primary transition-colors">
          {product.title}
        </h3>

        <p className="text-lg font-bold text-ds-foreground">
          {t(locale, "printOnDemand.from")}{" "}
          {formatCurrency((product.basePrice.amount ?? 0), product.basePrice.currencyCode, locale as SupportedLocale)}
        </p>

        <div className="flex flex-wrap gap-2 text-xs text-ds-muted-foreground">
          {product.printAreas != null && (
            <span className="px-2 py-0.5 bg-ds-muted rounded-full">
              {product.printAreas} {t(locale, "printOnDemand.print_areas")}
            </span>
          )}
          {product.colors != null && (
            <span className="px-2 py-0.5 bg-ds-muted rounded-full">
              {product.colors} {t(locale, "printOnDemand.colors")}
            </span>
          )}
          {product.sizes && product.sizes.length > 0 && (
            <span className="px-2 py-0.5 bg-ds-muted rounded-full">
              {product.sizes.length} {t(locale, "printOnDemand.sizes")}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDesign?.(product.id)}
          className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90 transition-colors"
        >
          {t(locale, "printOnDemand.start_designing")}
        </button>
      </div>
    </div>
  )
}
