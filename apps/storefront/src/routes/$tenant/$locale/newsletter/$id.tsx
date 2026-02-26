// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { NewsletterBlock } from "@/components/blocks/newsletter-block"
import { ReviewListBlock } from '@/components/blocks/review-list-block'
import { useState } from "react"
import { useToast } from "@/components/ui/toast"
import { t } from "@/lib/i18n"

function normalizeDetail(item: any) {
  if (!item) return null
  const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {})
  return { ...meta, ...item,
    thumbnail: item.thumbnail || item.image_url || item.photo_url || item.banner_url || item.logo_url || meta.thumbnail || (meta.images && meta.images[0]) || null,
    images: meta.images || [item.photo_url || item.banner_url || item.logo_url].filter(Boolean),
    description: item.description || meta.description || "",
    price: item.price ?? meta.price ?? null,
    rating: item.rating ?? item.avg_rating ?? meta.rating ?? null,
    review_count: item.review_count ?? meta.review_count ?? null,
    location: item.location || item.city || item.address || meta.location || null,
  }
}

export const Route = createFileRoute("/$tenant/$locale/newsletter/$id")({
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/newsletters/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
  component: NewsletterDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Newsletter Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
})

function NewsletterDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const baseUrl = getServerBaseUrl()
  const publishableKey = getMedusaPublishableKey()

  const loaderData = Route.useLoaderData()
  const newsletter = loaderData?.item

  if (!newsletter) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Newsletter Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This newsletter may have been removed or is no longer available.</p>
            <Link to={`${prefix}/newsletter` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Newsletters
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const resp = await fetch(`${baseUrl}/store/newsletters`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": publishableKey },
        credentials: "include",
        body: JSON.stringify({ email, newsletter_id: id })
      })
      if (resp.ok) {
        setSubscribed(true)
        toast.success("Successfully subscribed to the newsletter!")
      } else toast.error("Something went wrong. Please try again.")
    } catch { toast.error("Network error. Please try again.") }
    finally { setLoading(false) }
  }

  const sampleContent = newsletter.sample_content || newsletter.preview || newsletter.recent_issues || []

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <Link to={`${prefix}/newsletter` as any} className="hover:text-ds-foreground transition-colors">Newsletters</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{newsletter.title || newsletter.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {newsletter.thumbnail || newsletter.image || newsletter.cover ? (
                <img loading="lazy" src={newsletter.thumbnail || newsletter.image || newsletter.cover} alt={newsletter.title || newsletter.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ds-primary/10 to-ds-info/15">
                  <svg className="w-16 h-16 text-ds-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {newsletter.frequency && (
                <span className="absolute top-4 start-4 px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary text-white">
                  {newsletter.frequency}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{newsletter.title || newsletter.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {newsletter.frequency && (
                  <div className="flex items-center gap-1.5 text-sm text-ds-muted-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{newsletter.frequency}</span>
                  </div>
                )}
                {newsletter.subscriber_count && (
                  <div className="flex items-center gap-1.5 text-sm text-ds-muted-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <span>{Number(newsletter.subscriber_count || 0).toLocaleString()} subscribers</span>
                  </div>
                )}
                {newsletter.author && (
                  <div className="flex items-center gap-1.5 text-sm text-ds-muted-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span>By {newsletter.author}</span>
                  </div>
                )}
              </div>
            </div>

            {newsletter.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">About This Newsletter</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{newsletter.description}</p>
              </div>
            )}

            {newsletter.topics && newsletter.topics.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Topics Covered</h2>
                <div className="flex flex-wrap gap-2">
                  {newsletter.topics.map((topic: string, idx: number) => (
                    <span key={idx} className="px-3 py-1.5 text-xs font-medium rounded-full bg-ds-muted text-ds-muted-foreground">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {sampleContent.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Sample Content</h2>
                <div className="space-y-4">
                  {sampleContent.map((item: any, idx: number) => (
                    <div key={idx} className="pb-4 border-b border-ds-border last:border-0 last:pb-0">
                      <h3 className="font-medium text-ds-foreground text-sm">{item.title || item.subject}</h3>
                      {item.date && <p className="text-xs text-ds-muted-foreground mt-0.5">{new Date(item.date).toLocaleDateString()}</p>}
                      {(item.preview || item.excerpt || item.description) && (
                        <p className="text-sm text-ds-muted-foreground mt-2">{item.preview || item.excerpt || item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newsletter.testimonials && newsletter.testimonials.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">What Readers Say</h2>
                <div className="space-y-4">
                  {newsletter.testimonials.map((t: any, idx: number) => (
                    <div key={idx} className="pb-4 border-b border-ds-border last:border-0">
                      <p className="text-sm text-ds-muted-foreground italic">"{t.text || t.quote}"</p>
                      <p className="text-sm font-medium text-ds-foreground mt-2">— {t.author || t.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-ds-muted-foreground">
                    {newsletter.price ? "Subscription" : "Free Newsletter"}
                  </p>
                  {newsletter.price ? (
                    <p className="text-3xl font-bold text-ds-foreground">${Number(newsletter.price || 0).toLocaleString()}<span className="text-base font-normal text-ds-muted-foreground">/{newsletter.billing_period || "month"}</span></p>
                  ) : (
                    <p className="text-3xl font-bold text-ds-success">Free</p>
                  )}
                </div>

                {subscribed ? (
                  <div className="text-center py-4">
                    <svg className="w-12 h-12 text-ds-success mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="font-medium text-ds-foreground">You're subscribed!</p>
                    <p className="text-sm text-ds-muted-foreground mt-1">Check your inbox for confirmation.</p>
                  </div>
                ) : (
                  <form aria-label="Newsletter subscription form" onSubmit={handleSubscribe} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t(locale, 'newsletter.email_placeholder')}
                      required
                      className="w-full px-3 py-2 border border-ds-border rounded-lg text-ds-foreground bg-ds-background focus:outline-none focus:ring-2 focus:ring-ds-primary text-sm"
                    />
                    <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {loading ? "Subscribing..." : "Subscribe"}
                    </button>
                  </form>
                )}
              </div>

              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h3 className="font-semibold text-ds-foreground mb-3">Newsletter Details</h3>
                <div className="space-y-2 text-sm">
                  {newsletter.frequency && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Frequency</span>
                      <span className="text-ds-foreground font-medium capitalize">{newsletter.frequency}</span>
                    </div>
                  )}
                  {newsletter.subscriber_count && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Subscribers</span>
                      <span className="text-ds-foreground font-medium">{Number(newsletter.subscriber_count || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {newsletter.issues_count && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Issues Published</span>
                      <span className="text-ds-foreground font-medium">{newsletter.issues_count}</span>
                    </div>
                  )}
                  {newsletter.created_at && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Started</span>
                      <span className="text-ds-foreground font-medium">{new Date(newsletter.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-ds-info/10 border border-ds-info/30 rounded-xl p-6">
                <h3 className="font-semibold text-ds-primary mb-2">No Spam, Ever</h3>
                <p className="text-sm text-ds-info">We respect your inbox. Unsubscribe at any time with one click.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NewsletterBlock />
      </div>
      <ReviewListBlock productId={newsletter.id || id} heading="Reviews" />
    </div>
  )
}
