// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { BulkPricingTableBlock } from "@/components/blocks/bulk-pricing-table-block"
import { useState } from "react"

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

export const Route = createFileRoute("/$tenant/$locale/volume-deals/$id")({
  component: VolumeDealsDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Volume Deal Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/volume-deals/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

function VolumeDealsDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [quantity, setQuantity] = useState(1)

  const loaderData = Route.useLoaderData()
  const item = loaderData?.item

  if (!item) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Product Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This volume deal may have been removed or is no longer available.</p>
            <Link to={`${prefix}/volume-deals` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Volume Deals
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const tiers = item.tiers || item.pricing_tiers || item.volume_tiers || []
  const basePrice = item.base_price || item.price

  const getCurrentTier = (qty: number) => {
    if (!tiers.length) return null
    let current = tiers[0]
    for (const tier of tiers) {
      if (qty >= (tier.min_quantity || tier.min || 0)) {
        current = tier
      }
    }
    return current
  }

  const currentTier = getCurrentTier(quantity)
  const currentPrice = currentTier?.price || basePrice
  const savings = basePrice && currentPrice ? ((1 - Number(currentPrice) / Number(basePrice)) * 100).toFixed(0) : 0

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <Link to={`${prefix}/volume-deals` as any} className="hover:text-ds-foreground transition-colors">Volume Deals</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{item.title || item.name || item.product_name}</span>
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
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ds-warning/10 to-ds-warning/15">
                  <svg className="w-16 h-16 text-ds-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{item.title || item.name || item.product_name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {basePrice != null && (
                  <span className="text-2xl font-bold text-ds-primary">${Number(basePrice || 0).toLocaleString()}</span>
                )}
                <span className="text-sm text-ds-muted-foreground">base price per unit</span>
              </div>
            </div>

            {item.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Product Description</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
              </div>
            )}

            {tiers.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Volume Pricing Tiers</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ds-border">
                        <th className="text-left py-3 text-ds-muted-foreground font-medium">Quantity</th>
                        <th className="text-left py-3 text-ds-muted-foreground font-medium">Price per Unit</th>
                        <th className="text-left py-3 text-ds-muted-foreground font-medium">Savings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiers.map((tier: any, idx: number) => {
                        const tierSavings = basePrice && tier.price ? ((1 - Number(tier.price) / Number(basePrice)) * 100).toFixed(0) : 0
                        const isActive = currentTier === tier
                        return (
                          <tr key={idx} className={`border-b border-ds-border last:border-0 ${isActive ? "bg-ds-primary/5" : ""}`}>
                            <td className="py-3 text-ds-foreground">
                              {tier.min_quantity || tier.min || 0}{tier.max_quantity || tier.max ? `-${tier.max_quantity || tier.max}` : "+"} units
                              {isActive && <span className="ms-2 text-xs text-ds-primary font-medium">Current</span>}
                            </td>
                            <td className="py-3 text-ds-foreground font-medium">${Number(tier.price || 0).toLocaleString()}</td>
                            <td className="py-3 text-ds-success font-medium">{tierSavings > 0 ? `${tierSavings}% off` : "-"}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(item.metadata || item.details) && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Product Details</h2>
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
                <div>
                  <label className="text-sm text-ds-muted-foreground block mb-2">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-ds-border rounded-lg text-ds-foreground bg-ds-background focus:outline-none focus:ring-2 focus:ring-ds-primary"
                  />
                </div>

                <div className="text-center pt-2">
                  <p className="text-sm text-ds-muted-foreground">Unit Price</p>
                  <p className="text-3xl font-bold text-ds-foreground">
                    ${currentPrice != null ? Number(currentPrice || 0).toLocaleString() : "—"}
                  </p>
                  {Number(savings) > 0 && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-ds-success/15 text-ds-success">
                      Save {savings}%
                    </span>
                  )}
                </div>

                <div className="border-t border-ds-border pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-ds-muted-foreground">Total</span>
                    <span className="text-lg font-bold text-ds-foreground">
                      ${currentPrice != null ? (Number(currentPrice || 0) * quantity).toLocaleString() : "—"}
                    </span>
                  </div>
                </div>

                <button className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                  Add to Cart
                </button>

                <button className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Request Custom Quote
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BulkPricingTableBlock productId={item.id} />
      </div>
    </div>
  )
}
