import { createFileRoute, Link } from "@tanstack/react-router"
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { useBlogPost } from "@/lib/hooks/use-content"
import { ArticleDetail } from "@/components/blog/article-detail"
import { RelatedArticles } from "@/components/blog/related-articles"
import { t } from "@/lib/i18n"
import { useState, useEffect } from "react"

export const Route = createFileRoute("/$tenant/$locale/blog/$slug")({
  component: BlogPostPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Blog Post"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/platform/cms/blog/${params.slug}`, {
        headers: { "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_8284bf2e6620fac6cd844648a64e64ed0b4a0cf402d4dfc66725ffc67854d8a6" },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: data.item || data }
    } catch { return { item: null } }
  },
})

function BlogPostPage() {
  const { tenant, locale, slug } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const { data: post, isLoading } = useBlogPost(slug)
  const [shareUrl, setShareUrl] = useState("")

  useEffect(() => {
    setShareUrl(window.location.href)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ds-muted">
        <div className="h-64 bg-ds-background animate-pulse" />
        <div className="content-container py-8 max-w-3xl mx-auto space-y-4">
          <div className="h-8 bg-ds-background rounded animate-pulse w-3/4" />
          <div className="h-4 bg-ds-background rounded animate-pulse w-1/2" />
          <div className="space-y-2 mt-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-ds-background rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-ds-muted flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl block mb-4">📄</span>
          <p className="text-ds-muted-foreground mb-4">{t(locale, "common.not_found")}</p>
          <Link
            to={`${prefix}/blog` as any}
            className="text-sm text-ds-primary hover:underline"
          >
            {t(locale, "common.back")}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ds-muted">
      {post.thumbnail && (
        <div className="relative h-64 md:h-80 bg-ds-background">
          <img
            src={post.thumbnail}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      <div className="content-container py-8">
        <div className="max-w-3xl mx-auto">
          <Link
            to={`${prefix}/blog` as any}
            className="inline-flex items-center text-sm text-ds-muted-foreground hover:text-ds-foreground mb-4 transition-colors"
          >
            <svg className="h-4 w-4 me-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t(locale, "common.back")}
          </Link>

          <ArticleDetail post={post} shareUrl={shareUrl} locale={locale} />

          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <div className="mt-8">
              <RelatedArticles articles={post.relatedPosts} locale={locale} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
