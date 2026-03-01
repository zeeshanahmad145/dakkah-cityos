import { useTenant } from "@/lib/context/tenant-context"
import { sanitizeHtml } from "@/lib/utils/sanitize-html"
import { t, formatDate } from "@/lib/i18n"
import type { BlogPost } from "@/lib/hooks/use-content"
import { AuthorCard } from "./author-card"
import { ArticleShare } from "./article-share"

interface ArticleDetailProps {
  post: BlogPost
  shareUrl?: string
  locale?: string
}

export function ArticleDetail({
  post,
  shareUrl,
  locale: localeProp,
}: ArticleDetailProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"

  return (
    <article className="bg-ds-background rounded-lg border border-ds-border p-6 md:p-8">
      {post.category && (
        <span className="inline-block px-3 py-1 text-xs font-medium bg-ds-primary text-ds-primary-foreground rounded-full mb-4">
          {post.category}
        </span>
      )}

      <h1 className="text-2xl md:text-3xl font-bold text-ds-foreground mb-4">
        {post.title}
      </h1>

      <div className="flex flex-wrap items-center gap-4 pb-6 mb-6 border-b border-ds-border text-sm text-ds-muted-foreground">
        {post.author && (
          <div className="flex items-center gap-2">
            {post.author.avatar && (
              <img
                loading="lazy"
                src={post.author.avatar}
                alt={post.author.name}
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="font-medium text-ds-foreground">
              {t(locale, "blog.by_author")} {post.author.name}
            </span>
          </div>
        )}
        <span>{formatDate(post.publishedAt, locale as import("@/lib/i18n").SupportedLocale)}</span>
        {post.readingTime && (
          <span>
            {post.readingTime} {t(locale, "blog.min_read")}
          </span>
        )}
      </div>

      <div
        className="prose prose-sm md:prose-base max-w-none text-ds-foreground [&_h2]:text-ds-foreground [&_h3]:text-ds-foreground [&_a]:text-ds-primary [&_blockquote]:border-ds-border [&_blockquote]:text-ds-muted-foreground"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content || "") }}
      />

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-ds-border">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-xs font-medium bg-ds-muted text-ds-muted-foreground rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {shareUrl && (
        <div className="mt-6 pt-6 border-t border-ds-border">
          <ArticleShare url={shareUrl} title={post.title} locale={locale} />
        </div>
      )}

      {post.author?.bio && (
        <div className="mt-8 pt-6 border-t border-ds-border">
          <AuthorCard
            name={post.author.name}
            avatar={post.author.avatar}
            bio={post.author.bio}
            variant="full"
            locale={locale}
          />
        </div>
      )}
    </article>
  )
}
