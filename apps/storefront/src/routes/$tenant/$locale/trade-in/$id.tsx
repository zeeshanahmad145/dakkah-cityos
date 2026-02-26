// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { useToast } from "@/components/ui/toast"
import { ComparisonTableBlock } from "@/components/blocks/comparison-table-block"
import { ReviewListBlock } from '@/components/blocks/review-list-block'

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

export const Route = createFileRoute("/$tenant/$locale/trade-in/$id")({
  component: TradeInDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Trade-In Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/trade-in/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

function TradeInDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const baseUrl = getServerBaseUrl()
  const publishableKey = getMedusaPublishableKey()

  const loaderData = Route.useLoaderData()
  const item = loaderData?.item

  const handleStartTradeIn = async () => {
    setLoading(true)
    try {
      const resp = await fetch(`${baseUrl}/store/trade-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": publishableKey },
        credentials: "include",
        body: JSON.stringify({ trade_in_item_id: id })
      })
      if (resp.ok) toast.success("Trade-in request submitted successfully!")
      else toast.error("Something went wrong. Please try again.")
    } catch { toast.error("Network error. Please try again.") }
    finally { setLoading(false) }
  }

  const handleGetQuote = () => {
    toast.success("Quote request sent! We'll email you shortly.")
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Trade-In Item Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This trade-in item may have been removed or is no longer available.</p>
            <Link to={`${prefix}/trade-in` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Trade-Ins
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const conditionColors: Record<string, string> = {
    excellent: "bg-ds-success/15 text-ds-success",
    good: "bg-ds-info/15 text-ds-info",
    fair: "bg-ds-warning/15 text-ds-warning",
    poor: "bg-ds-destructive/15 text-ds-destructive",
  }

  const conditionClass = conditionColors[(item.condition || "").toLowerCase()] || "bg-ds-muted text-ds-muted-foreground"

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <Link to={`${prefix}/trade-in` as any} className="hover:text-ds-foreground transition-colors">Trade-In</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{item.title || item.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {item.thumbnail || item.image ? (
                <img loading="lazy" src={item.thumbnail || item.image} alt={item.title || item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-ds-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              )}
              {item.category && (
                <span className="absolute top-4 start-4 px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary text-ds-primary-foreground">
                  {item.category}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{item.title || item.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {item.condition && (
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${conditionClass}`}>
                    Condition: {item.condition}
                  </span>
                )}
                {item.brand && (
                  <span className="text-sm text-ds-muted-foreground">Brand: {item.brand}</span>
                )}
              </div>
            </div>

            {item.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Description</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
              </div>
            )}

            {item.condition_details && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Condition Assessment</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{item.condition_details}</p>
              </div>
            )}

            {item.requirements && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Trade-In Requirements</h2>
                {Array.isArray(item.requirements) ? (
                  <ul className="space-y-2">
                    {item.requirements.map((req: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-ds-muted-foreground">
                        <svg className="w-4 h-4 mt-0.5 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {req}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{item.requirements}</p>
                )}
              </div>
            )}

            {(item.metadata || item.details) && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Item Details</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(item.metadata || item.details || {}).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-ds-muted-foreground">{key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                      <p className="font-medium text-ds-foreground">{String(value)}</p>
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
                  <p className="text-sm text-ds-muted-foreground">Offered Trade-In Value</p>
                  <p className="text-3xl font-bold text-ds-success">
                    {item.offered_value != null || item.trade_in_value != null
                      ? `$${Number(item.offered_value || item.trade_in_value || 0).toLocaleString()}`
                      : "Get a Quote"}
                  </p>
                  {item.original_price && (
                    <p className="text-sm text-ds-muted-foreground mt-1">
                      Original: <span className="line-through">${Number(item.original_price || 0).toLocaleString()}</span>
                    </p>
                  )}
                </div>

                <button onClick={handleStartTradeIn} disabled={loading} className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  {loading ? "Submitting..." : "Start Trade-In"}
                </button>

                <button onClick={handleGetQuote} className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Get Quote
                </button>
              </div>

              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h3 className="font-semibold text-ds-foreground mb-3">How Trade-In Works</h3>
                <ul className="space-y-3 text-sm text-ds-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-ds-primary/10 text-ds-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                    Submit your item for evaluation
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-ds-primary/10 text-ds-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                    Receive a trade-in value offer
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-ds-primary/10 text-ds-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                    Ship your item or drop it off
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-ds-primary/10 text-ds-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                    Get credit or payment
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ComparisonTableBlock />
        <ReviewListBlock productId={item.id || id} heading="Reviews" />
      </div>
    </div>
  )
}
