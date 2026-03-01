import { Link } from "@tanstack/react-router"
import { t } from "@/lib/i18n"
import { useTenant, useTenantPrefix } from "@/lib/context/tenant-context"

interface Category {
  id: string
  name: string
  icon: string
  slug: string
  productCount?: number
  color?: string
}

interface MarketplaceCategoriesProps {
  locale?: string
  categories?: Category[]
}

const defaultCategories: Category[] = [
  {
    id: "electronics",
    name: "category_electronics",
    icon: "💻",
    slug: "electronics",
    productCount: 1240,
    color: "bg-ds-info/10",
  },
  {
    id: "fashion",
    name: "category_fashion",
    icon: "👗",
    slug: "fashion",
    productCount: 3500,
    color: "bg-ds-destructive/10",
  },
  {
    id: "home",
    name: "category_home",
    icon: "🏠",
    slug: "home-garden",
    productCount: 890,
    color: "bg-ds-success/10",
  },
  {
    id: "beauty",
    name: "category_beauty",
    icon: "✨",
    slug: "beauty",
    productCount: 2100,
    color: "bg-ds-primary/10",
  },
  {
    id: "sports",
    name: "category_sports",
    icon: "⚽",
    slug: "sports",
    productCount: 760,
    color: "bg-ds-warning/10",
  },
  {
    id: "toys",
    name: "category_toys",
    icon: "🎮",
    slug: "toys-games",
    productCount: 430,
    color: "bg-ds-warning/10",
  },
  {
    id: "automotive",
    name: "category_automotive",
    icon: "🚗",
    slug: "automotive",
    productCount: 320,
    color: "bg-ds-destructive/10",
  },
  {
    id: "books",
    name: "category_books",
    icon: "📚",
    slug: "books",
    productCount: 5600,
    color: "bg-ds-success/10",
  },
]

export function MarketplaceCategories({
  locale: localeProp,
  categories,
}: MarketplaceCategoriesProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const prefix = useTenantPrefix()
  const cats = categories || defaultCategories

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-ds-foreground">
          {t(locale, "marketplace.browse_categories")}
        </h2>
        <Link
          to={`${prefix}/marketplace` as never}
          className="text-sm text-ds-primary hover:underline"
        >
          {t(locale, "marketplace.view_all_categories")}
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {cats.map((category) => (
          <Link
            key={category.id}
            to={`${prefix}/marketplace/${category.slug}` as never}
            className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-ds-border bg-ds-card hover:border-ds-primary/50 hover:shadow-md transition-all"
          >
            <div
              className={`w-14 h-14 rounded-xl ${category.color || "bg-ds-muted"} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}
            >
              {category.icon}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-ds-foreground">
                {t(locale, `marketplace.${category.name}`)}
              </p>
              {category.productCount !== undefined && (
                <p className="text-xs text-ds-muted-foreground mt-0.5">
                  {category.productCount.toLocaleString()}{" "}
                  {t(locale, "marketplace.products_count")}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
