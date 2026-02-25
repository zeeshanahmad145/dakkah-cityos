// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ReviewListBlock } from "@/components/blocks/review-list-block"

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

export const Route = createFileRoute("/$tenant/$locale/try-before-you-buy/$id")({
  component: TryBeforeYouBuyDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Try Before You Buy Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/try-before-you-buy/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

function TryBeforeYouBuyDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const product = loaderData?.item

  if (!product) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Product Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This try-before-you-buy product may have been removed or is no longer available.</p>
            <Link to={`${prefix}/try-before-you-buy` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <Link to={`${prefix}/try-before-you-buy` as any} className="hover:text-ds-foreground transition-colors">Try Before You Buy</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{product.title || product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {product.thumbnail || product.image ? (
                <img loading="lazy" src={product.thumbnail || product.image} alt={product.title || product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-ds-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}
              <span className="absolute top-4 start-4 px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary text-white">
                Try Before You Buy
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{product.title || product.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <span className="text-2xl font-bold text-ds-primary">
                  {product.price != null ? `$${Number(product.price || 0).toLocaleString()}` : "Contact for price"}
                </span>
                {product.trial_period && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-ds-primary/15 text-ds-primary">
                    {product.trial_period} Trial
                  </span>
                )}
              </div>
            </div>

            {product.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Product Description</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {product.included && product.included.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">What's Included</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.included.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                      <svg className="w-4 h-4 text-ds-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.return_policy && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Return Policy</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{typeof product.return_policy === "string" ? product.return_policy : JSON.stringify(product.return_policy)}</p>
              </div>
            )}

            {(product.metadata || product.details) && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Specifications</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(product.metadata || product.details || {}).map(([key, value]) => (
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
                  <p className="text-sm text-ds-muted-foreground">Product Price</p>
                  <p className="text-3xl font-bold text-ds-foreground">
                    {product.price != null ? `$${Number(product.price || 0).toLocaleString()}` : "Contact for price"}
                  </p>
                  {product.trial_period && (
                    <p className="text-sm text-ds-primary font-medium mt-1">Try free for {product.trial_period}</p>
                  )}
                </div>

                <button className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  Start Trial
                </button>

                <button className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                  Buy Now
                </button>
              </div>

              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h3 className="font-semibold text-ds-foreground mb-3">How It Works</h3>
                <ul className="space-y-3 text-sm text-ds-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-ds-primary/15 text-ds-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                    Order the product to try at home
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-ds-primary/15 text-ds-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                    Try it during the trial period
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-ds-primary/15 text-ds-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                    Keep it and pay, or return for free
                  </li>
                </ul>
              </div>

              <div className="bg-ds-primary/10 border border-ds-primary/30 rounded-xl p-6">
                <h3 className="font-semibold text-ds-primary mb-2">Risk-Free Guarantee</h3>
                <p className="text-sm text-ds-primary">No payment until you decide to keep the product. Free returns within the trial period.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReviewListBlock productId={product.id} />
      </div>
    </div>
  )
}
