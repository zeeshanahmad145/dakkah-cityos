import { Link } from "@tanstack/react-router"
import { useTenantPrefix, useTenant } from "@/lib/context/tenant-context"
import { t } from "@/lib/i18n"

interface FAQCategoryCardProps {
  id: string
  title: string
  description?: string
  icon?: string
  articleCount: number
  slug: string
  locale?: string
}

const defaultIcons: Record<string, string> = {
  "getting-started": "🚀",
  orders: "📦",
  payments: "💳",
  shipping: "🚚",
  returns: "↩️",
  account: "👤",
  security: "🔒",
  general: "📋",
}

export function FAQCategoryCard({
  id,
  title,
  description,
  icon,
  articleCount,
  slug,
  locale: localeProp,
}: FAQCategoryCardProps) {
  const prefix = useTenantPrefix()
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"

  return (
    <Link
      to={`${prefix}/help?category=${slug}` as never}
      className="group flex flex-col items-center p-6 bg-ds-background rounded-lg border border-ds-border hover:border-ds-primary hover:shadow-sm transition-all text-center"
    >
      <span className="text-3xl mb-3">
        {icon || defaultIcons[slug] || "📄"}
      </span>
      <h3 className="text-base font-semibold text-ds-foreground group-hover:text-ds-primary transition-colors mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-ds-muted-foreground mb-2 line-clamp-2">
          {description}
        </p>
      )}
      <span className="text-xs text-ds-muted-foreground">
        {articleCount} {t(locale, "blocks.items")}
      </span>
    </Link>
  )
}
