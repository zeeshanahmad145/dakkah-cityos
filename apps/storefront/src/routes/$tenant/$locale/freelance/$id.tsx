// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { FreelancerProfileBlock } from "@/components/blocks/freelancer-profile-block"
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

export const Route = createFileRoute("/$tenant/$locale/freelance/$id")({
  component: FreelanceDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Freelance Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/freelance/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

function FreelanceDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [selectedTier, setSelectedTier] = useState(0)

  const loaderData = Route.useLoaderData()
  const gig = loaderData?.item

  if (!gig) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Gig Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This freelance listing may have been removed or is no longer available.</p>
            <Link to={`${prefix}/freelance` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Freelance
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const tiers = gig.packages || gig.tiers || []

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <Link to={`${prefix}/freelance` as any} className="hover:text-ds-foreground transition-colors">Freelance</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{gig.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {gig.thumbnail || gig.image ? (
                <img loading="lazy" src={gig.thumbnail || gig.image} alt={gig.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-ds-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {gig.category && (
                <span className="absolute top-4 start-4 px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary text-ds-primary-foreground">{gig.category}</span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{gig.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {gig.seller && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-ds-primary/10 rounded-full flex items-center justify-center text-ds-primary font-semibold text-sm">
                      {(gig.seller.name || "S").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-ds-foreground">{gig.seller.name}</span>
                  </div>
                )}
                {gig.rating && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-ds-warning" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <span className="text-sm font-medium text-ds-foreground">{gig.rating}</span>
                    {gig.review_count && <span className="text-sm text-ds-muted-foreground">({gig.review_count})</span>}
                  </div>
                )}
                {gig.delivery_time && (
                  <div className="flex items-center gap-1.5 text-sm text-ds-muted-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{gig.delivery_time} day delivery</span>
                  </div>
                )}
              </div>
            </div>

            {gig.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">About This Gig</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{gig.description}</p>
              </div>
            )}

            {gig.seller && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">About The Seller</h2>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-ds-primary/10 rounded-full flex items-center justify-center text-ds-primary font-semibold text-xl">
                    {(gig.seller.name || "S").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-ds-foreground">{gig.seller.name}</p>
                    {gig.seller.title && <p className="text-sm text-ds-muted-foreground">{gig.seller.title}</p>}
                    {gig.seller.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <svg className="w-4 h-4 text-ds-warning" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        <span className="text-sm text-ds-foreground">{gig.seller.rating}</span>
                      </div>
                    )}
                    {gig.seller.description && (
                      <p className="text-sm text-ds-muted-foreground mt-2">{gig.seller.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {gig.reviews && gig.reviews.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Reviews</h2>
                <div className="space-y-4">
                  {gig.reviews.map((review: any, idx: number) => (
                    <div key={idx} className="pb-4 border-b border-ds-border last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? "text-ds-warning" : "text-ds-muted"}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-ds-foreground">{review.author}</span>
                      </div>
                      <p className="text-sm text-ds-muted-foreground">{review.comment || review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              {tiers.length > 0 ? (
                <div className="bg-ds-background border border-ds-border rounded-xl overflow-hidden">
                  <div className="flex border-b border-ds-border">
                    {tiers.map((tier: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTier(idx)}
                        className={`flex-1 py-3 px-2 text-sm font-medium transition-colors ${selectedTier === idx ? "bg-ds-primary text-ds-primary-foreground" : "text-ds-foreground hover:bg-ds-muted"}`}
                      >
                        {tier.name || ["Basic", "Standard", "Premium"][idx] || `Tier ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-2xl font-bold text-ds-foreground">
                      ${Number(tiers[selectedTier]?.price || 0).toLocaleString()}
                    </p>
                    {tiers[selectedTier]?.description && (
                      <p className="text-sm text-ds-muted-foreground">{tiers[selectedTier].description}</p>
                    )}
                    {tiers[selectedTier]?.delivery_time && (
                      <div className="flex items-center gap-1.5 text-sm text-ds-muted-foreground">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{tiers[selectedTier].delivery_time} day delivery</span>
                      </div>
                    )}
                    {tiers[selectedTier]?.features && (
                      <ul className="space-y-2">
                        {tiers[selectedTier].features.map((f: string, fIdx: number) => (
                          <li key={fIdx} className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                            <svg className="w-4 h-4 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors">
                      Continue (${Number(tiers[selectedTier]?.price || 0).toLocaleString()})
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                  <p className="text-3xl font-bold text-ds-foreground text-center">
                    {gig.price != null ? `$${Number(gig.price || 0).toLocaleString()}` : "Contact for price"}
                  </p>
                  {gig.delivery_time && (
                    <div className="flex items-center justify-center gap-1.5 text-sm text-ds-muted-foreground">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>{gig.delivery_time} day delivery</span>
                    </div>
                  )}
                  <button className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors">
                    Order Now
                  </button>
                </div>
              )}

              <button className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Contact Seller
              </button>
            </div>
          </aside>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FreelancerProfileBlock freelancerId={gig.id} />
          <ReviewListBlock productId={gig.id} />
        </div>
      </div>
    </div>
  )
}
