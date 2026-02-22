import { createFileRoute, Link } from "@tanstack/react-router"
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { sanitizeHtml } from "@/lib/utils/sanitize-html"
import { useState } from "react"
import { useHelpArticle } from "@/lib/hooks/use-content"
import { FAQAccordion } from "@/components/help/faq-accordion"
import { HelpCenterLayout } from "@/components/help/help-center-layout"
import { t, formatDate } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/help/$slug")({
  component: HelpArticlePage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Help Article"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/platform/cms/help/${params.slug}`, {
        headers: { "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_8284bf2e6620fac6cd844648a64e64ed0b4a0cf402d4dfc66725ffc67854d8a6" },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: data.item || data }
    } catch { return { item: null } }
  },
})

function HelpArticlePage() {
  const { tenant, locale, slug } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const { data: article, isLoading } = useHelpArticle(slug)
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ds-muted">
        <div className="content-container py-8 max-w-3xl mx-auto">
          <div className="h-6 bg-ds-background rounded animate-pulse w-1/3 mb-4" />
          <div className="h-8 bg-ds-background rounded animate-pulse w-2/3 mb-8" />
          <div className="bg-ds-background rounded-lg p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-ds-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-ds-muted flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl block mb-4">📄</span>
          <p className="text-ds-muted-foreground mb-4">{t(locale, "common.not_found")}</p>
          <Link
            to={`${prefix}/help` as any}
            className="text-sm text-ds-primary hover:underline"
          >
            {t(locale, "common.back")}
          </Link>
        </div>
      </div>
    )
  }

  const sidebar = (
    <div className="space-y-4">
      <Link
        to={`${prefix}/help` as any}
        className="inline-flex items-center text-sm text-ds-muted-foreground hover:text-ds-foreground transition-colors"
      >
        <svg className="h-4 w-4 me-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t(locale, "faq.back_to_help")}
      </Link>

      {article.relatedArticles && article.relatedArticles.length > 0 && (
        <div className="bg-ds-background rounded-lg border border-ds-border p-4">
          <h3 className="text-sm font-semibold text-ds-foreground mb-3">
            {t(locale, "blog.related_articles")}
          </h3>
          <div className="space-y-2">
            {article.relatedArticles.map((related) => (
              <Link
                key={related.id}
                to={`${prefix}/help/${related.slug}` as any}
                className="block text-sm text-ds-muted-foreground hover:text-ds-primary transition-colors py-1"
              >
                {related.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-ds-muted">
      <div className="content-container py-8">
        <HelpCenterLayout sidebar={sidebar} locale={locale}>
          <div className="max-w-3xl">
            <nav className="flex items-center gap-2 text-sm text-ds-muted-foreground mb-6">
              <Link to={`${prefix}/help` as any} className="hover:text-ds-foreground transition-colors">
                {t(locale, "faq.help_center")}
              </Link>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-ds-foreground">{article.category}</span>
            </nav>

            <article className="bg-ds-background rounded-lg border border-ds-border p-6 md:p-8">
              <h1 className="text-2xl font-bold text-ds-foreground mb-2">{article.title}</h1>
              {article.updatedAt && (
                <p className="text-sm text-ds-muted-foreground mb-6">
                  {formatDate(article.updatedAt, locale as any)}
                </p>
              )}

              <div
                className="prose prose-sm md:prose-base max-w-none text-ds-foreground [&_h2]:text-ds-foreground [&_h3]:text-ds-foreground [&_a]:text-ds-primary [&_ul]:list-disc [&_ol]:list-decimal"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content || article.excerpt || "") }}
              />

              <div className="mt-8 pt-6 border-t border-ds-border">
                <p className="text-sm font-medium text-ds-foreground mb-3">
                  {t(locale, "faq.was_helpful")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFeedback("yes")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      feedback === "yes"
                        ? "bg-ds-success text-white border-ds-success"
                        : "bg-ds-background text-ds-foreground border-ds-border hover:bg-ds-muted"
                    }`}
                  >
                    👍 {t(locale, "blocks.yes")}
                  </button>
                  <button
                    onClick={() => setFeedback("no")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      feedback === "no"
                        ? "bg-ds-destructive text-white border-ds-destructive"
                        : "bg-ds-background text-ds-foreground border-ds-border hover:bg-ds-muted"
                    }`}
                  >
                    👎 {t(locale, "blocks.no")}
                  </button>
                </div>
                {feedback && (
                  <p className="text-sm text-ds-muted-foreground mt-3">
                    {feedback === "yes"
                      ? t(locale, "faq.feedback_positive")
                      : t(locale, "faq.feedback_negative")
                    }
                  </p>
                )}
              </div>
            </article>
          </div>
        </HelpCenterLayout>
      </div>
    </div>
  )
}
