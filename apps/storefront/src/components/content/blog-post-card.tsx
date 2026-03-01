import { Link } from "@tanstack/react-router"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { t, formatDate } from "@/lib/i18n"
import { useParams } from "@tanstack/react-router"
import type { BlogPost } from "@/lib/hooks/use-content"

interface BlogPostCardProps {
  post: BlogPost
  variant?: "default" | "compact" | "featured" | "horizontal"
}

export function BlogPostCard({ post, variant = "default" }: BlogPostCardProps) {
  const prefix = useTenantPrefix()
  const { locale } = useParams({ strict: false }) as { locale: string }

  if (variant === "compact") {
    return (
      <Link
        to={`${prefix}/blog/${post.slug}` as never}
        className="flex items-center gap-3 group"
      >
        {post.thumbnail && (
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-ds-muted">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-ds-foreground group-hover:text-ds-primary line-clamp-2 transition-colors">
            {post.title}
          </h4>
          <p className="text-xs text-ds-muted-foreground mt-1">
            {formatDate(post.publishedAt, locale as import("@/lib/i18n").SupportedLocale)}
          </p>
        </div>
      </Link>
    )
  }

  if (variant === "featured") {
    return (
      <Link
        to={`${prefix}/blog/${post.slug}` as never}
        className="group relative block overflow-hidden rounded-xl bg-ds-muted"
      >
        {post.thumbnail && (
          <img
            src={post.thumbnail}
            alt={post.title}
            className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 start-0 end-0 p-6">
          {post.category && (
            <span className="inline-block px-3 py-1 text-xs font-medium bg-ds-primary text-ds-primary-foreground rounded-full mb-3">
              {post.category}
            </span>
          )}
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-sm text-white/80 line-clamp-2 mb-3">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center gap-3 text-sm text-white/70">
            {post.author && (
              <div className="flex items-center gap-2">
                {post.author.avatar && (
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span>{post.author.name}</span>
              </div>
            )}
            <span>·</span>
            <span>{formatDate(post.publishedAt, locale as import("@/lib/i18n").SupportedLocale)}</span>
            {post.readingTime && (
              <>
                <span>·</span>
                <span>
                  {post.readingTime} {t(locale, "content.min_read")}
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    )
  }

  if (variant === "horizontal") {
    return (
      <Link
        to={`${prefix}/blog/${post.slug}` as never}
        className="group flex flex-col sm:flex-row gap-4 bg-ds-background rounded-lg border border-ds-border overflow-hidden hover:border-ds-primary transition-colors"
      >
        {post.thumbnail && (
          <div className="sm:w-48 h-48 sm:h-auto flex-shrink-0 bg-ds-muted">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 p-4">
          {post.category && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-ds-muted text-ds-muted-foreground rounded mb-2">
              {post.category}
            </span>
          )}
          <h3 className="text-lg font-semibold text-ds-foreground group-hover:text-ds-primary transition-colors mb-2">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-sm text-ds-muted-foreground line-clamp-2 mb-3">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-ds-muted-foreground">
            {post.author && (
              <div className="flex items-center gap-1.5">
                {post.author.avatar && (
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <span>{post.author.name}</span>
              </div>
            )}
            <span>{formatDate(post.publishedAt, locale as import("@/lib/i18n").SupportedLocale)}</span>
            {post.readingTime && (
              <span>
                {post.readingTime} {t(locale, "content.min_read")}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`${prefix}/blog/${post.slug}` as never}
      className="group flex flex-col bg-ds-background rounded-lg border border-ds-border overflow-hidden hover:border-ds-primary transition-colors"
    >
      {post.thumbnail && (
        <div className="aspect-video bg-ds-muted overflow-hidden">
          <img
            src={post.thumbnail}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        {post.category && (
          <span className="inline-block self-start px-2 py-0.5 text-xs font-medium bg-ds-muted text-ds-muted-foreground rounded mb-2">
            {post.category}
          </span>
        )}
        <h3 className="text-base font-semibold text-ds-foreground group-hover:text-ds-primary transition-colors mb-2 line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-ds-muted-foreground line-clamp-2 mb-3 flex-1">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-ds-muted-foreground mt-auto pt-3 border-t border-ds-border">
          <div className="flex items-center gap-2">
            {post.author && (
              <>
                {post.author.avatar && (
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <span>{post.author.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>{formatDate(post.publishedAt, locale as import("@/lib/i18n").SupportedLocale)}</span>
            {post.readingTime && (
              <span>
                · {post.readingTime} {t(locale, "content.min_read")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
