import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { t } from "@/lib/i18n"
import { useParams } from "@tanstack/react-router"
import { MagnifyingGlass } from "@medusajs/icons"
import type { HelpCategory, HelpArticle } from "@/lib/hooks/use-content"

interface HelpCenterProps {
  categories: HelpCategory[]
  featuredArticles?: HelpArticle[]
  onSearch?: (query: string) => void
}

const categoryIcons: Record<string, string> = {
  "getting-started": "🚀",
  orders: "📦",
  payments: "💳",
  shipping: "🚚",
  returns: "↩️",
  account: "👤",
  security: "🔒",
  general: "📋",
}

export function HelpCenter({
  categories,
  featuredArticles,
  onSearch,
}: HelpCenterProps) {
  const prefix = useTenantPrefix()
  const { locale } = useParams({ strict: false }) as { locale: string }
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  return (
    <div className="space-y-8">
      <div className="bg-ds-primary rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-ds-primary-foreground mb-2">
          {t(locale, "content.help_center")}
        </h2>
        <p className="text-ds-primary-foreground/80 mb-6">
          {t(locale, "content.search_help")}
        </p>
        <div className="max-w-lg mx-auto relative">
          <MagnifyingGlass className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ds-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t(locale, "content.search_help")}
            className="w-full ps-12 pe-4 py-3 rounded-lg bg-ds-background text-ds-foreground border border-ds-border focus:outline-none focus:ring-2 focus:ring-ds-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`${prefix}/help?category=${category.slug}` as never}
            className="group flex flex-col items-center p-6 bg-ds-background rounded-lg border border-ds-border hover:border-ds-primary hover:shadow-sm transition-all text-center"
          >
            <span className="text-3xl mb-3">
              {categoryIcons[category.slug] || "📄"}
            </span>
            <h3 className="text-base font-semibold text-ds-foreground group-hover:text-ds-primary transition-colors mb-1">
              {category.title}
            </h3>
            {category.description && (
              <p className="text-sm text-ds-muted-foreground mb-2 line-clamp-2">
                {category.description}
              </p>
            )}
            <span className="text-xs text-ds-muted-foreground">
              {category.articleCount} {t(locale, "blocks.items")}
            </span>
          </Link>
        ))}
      </div>

      {featuredArticles && featuredArticles.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-ds-foreground mb-4">
            {t(locale, "blocks.featured")}
          </h3>
          <div className="space-y-3">
            {featuredArticles.map((article) => (
              <Link
                key={article.id}
                to={`${prefix}/help/${article.slug}` as never}
                className="flex items-center justify-between p-4 bg-ds-background rounded-lg border border-ds-border hover:border-ds-primary transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-ds-foreground">
                    {article.title}
                  </h4>
                  {article.excerpt && (
                    <p className="text-xs text-ds-muted-foreground mt-1 line-clamp-1">
                      {article.excerpt}
                    </p>
                  )}
                </div>
                <span className="text-xs text-ds-muted-foreground ms-4 flex-shrink-0">
                  {article.category}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
