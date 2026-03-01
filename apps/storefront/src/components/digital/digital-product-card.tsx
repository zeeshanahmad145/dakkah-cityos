import { Link } from "@tanstack/react-router"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { useLocale } from "@/lib/context/tenant-context"
import { formatCurrency } from "@/lib/i18n"
import { Star } from "@medusajs/icons"
import type { DigitalProduct } from "@/lib/hooks/use-digital-products"

interface DigitalProductCardProps {
  product: DigitalProduct
}

const fileTypeColors: Record<string, string> = {
  pdf: "bg-ds-destructive/10 text-ds-destructive",
  ebook: "bg-ds-accent/10 text-ds-accent",
  audio: "bg-ds-accent/10 text-ds-accent",
  video: "bg-ds-success/10 text-ds-success",
  software: "bg-ds-warning/10 text-ds-warning",
  image: "bg-ds-accent/10 text-ds-accent",
  template: "bg-ds-success/10 text-ds-success",
}

export function DigitalProductCard({ product }: DigitalProductCardProps) {
  const prefix = useTenantPrefix()
  const { locale } = useLocale()

  return (
    <Link
      to={`${prefix}/digital/${product.id}` as never}
      className="group bg-ds-background rounded-lg border border-ds-border overflow-hidden hover:shadow-md transition-all"
    >
      <div className="aspect-[4/3] bg-ds-muted relative overflow-hidden">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-ds-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        <div className="absolute top-2 start-2">
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded ${fileTypeColors[product.file_type] || "bg-ds-muted text-ds-muted-foreground"}`}
          >
            {product.file_type.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-ds-foreground line-clamp-2 group-hover:text-ds-primary transition-colors">
          {product.title}
        </h3>

        <div className="flex items-center gap-2 mt-2 text-sm text-ds-muted-foreground">
          <span>{product.file_size}</span>
          {product.format && (
            <>
              <span className="text-ds-border">·</span>
              <span>{product.format}</span>
            </>
          )}
        </div>

        {product.rating && (
          <div className="flex items-center gap-1 mt-2">
            <Star className="h-4 w-4 text-ds-warning" />
            <span className="text-sm font-medium text-ds-foreground">
              {product.rating.average.toFixed(1)}
            </span>
            <span className="text-sm text-ds-muted-foreground">
              ({product.rating.count})
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-ds-border">
          <span className="text-lg font-bold text-ds-foreground">
            {formatCurrency((product.price ?? 0), product.currency_code, locale as import("@/lib/i18n").SupportedLocale)}
          </span>
          <span className="text-sm font-medium text-ds-primary group-hover:underline">
            View Details
          </span>
        </div>
      </div>
    </Link>
  )
}
