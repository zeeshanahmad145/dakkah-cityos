// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { VendorProfileBlock } from "@/components/blocks/vendor-profile-block"
import { VendorProductsBlock } from "@/components/blocks/vendor-products-block"

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

export const Route = createFileRoute("/$tenant/$locale/vendors/$id")({
  component: VendorDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Vendor Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/vendors/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.vendor || data.item || data) }
    } catch { return { item: null } }
  },
})

function VendorDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [following, setFollowing] = useState(false)

  const loaderData = Route.useLoaderData()
  const vendor = loaderData?.item

  const products = null
  const productsLoading = false
  const reviews = null

  if (!vendor) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Vendor Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This vendor profile may have been removed or is no longer available.</p>
            <Link to={`${prefix}/vendors` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Vendors
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= Math.round(rating) ? "text-ds-warning" : "text-ds-muted"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
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
            <Link to={`${prefix}/vendors` as any} className="hover:text-ds-foreground transition-colors">Vendors</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{vendor.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-ds-primary/10 rounded-full flex items-center justify-center text-ds-primary text-2xl font-bold flex-shrink-0">
                  {vendor.logo ? (
                    <img loading="lazy" src={vendor.logo} alt={vendor.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (vendor.name || "V").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{vendor.name}</h1>
                  {vendor.rating != null && (
                    <div className="flex items-center gap-2 mt-2">
                      {renderStars(vendor.rating)}
                      <span className="text-sm text-ds-muted-foreground">
                        ({vendor.rating.toFixed(1)}{vendor.review_count ? ` · ${vendor.review_count} reviews` : ""})
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-ds-muted-foreground">
                    {vendor.product_count != null && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        <span>{vendor.product_count} products</span>
                      </div>
                    )}
                    {vendor.created_at && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>Joined {new Date(vendor.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {vendor.description && (
                <p className="mt-4 text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{vendor.description}</p>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-ds-foreground mb-4">Products</h2>
              {productsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square bg-ds-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : products && products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {products.map((product: any) => (
                    <Link
                      key={product.id}
                      to={`${prefix}/products/${product.handle || product.id}` as any}
                      className="group bg-ds-background border border-ds-border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-square bg-ds-muted overflow-hidden">
                        {product.thumbnail ? (
                          <img loading="lazy" src={product.thumbnail} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-ds-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-ds-foreground truncate">{product.title}</h3>
                        {product.price != null && (
                          <p className="text-sm font-semibold text-ds-primary mt-1">${Number(product.price || 0).toLocaleString()}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-ds-background border border-ds-border rounded-lg p-8 text-center">
                  <p className="text-ds-muted-foreground">No products listed yet</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-ds-foreground mb-4">Reviews & Ratings</h2>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="bg-ds-background border border-ds-border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-ds-muted rounded-full flex items-center justify-center text-xs font-semibold text-ds-foreground">
                          {(review.customer_name || review.author || "A").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-ds-foreground">{review.customer_name || review.author || "Anonymous"}</p>
                          {review.created_at && (
                            <p className="text-xs text-ds-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                          )}
                        </div>
                        {review.rating != null && (
                          <div className="ms-auto">{renderStars(review.rating)}</div>
                        )}
                      </div>
                      {review.title && <p className="text-sm font-medium text-ds-foreground mb-1">{review.title}</p>}
                      {review.content && <p className="text-sm text-ds-muted-foreground">{review.content}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-ds-background border border-ds-border rounded-lg p-8 text-center">
                  <p className="text-ds-muted-foreground">No reviews yet</p>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                <button className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Contact Vendor
                </button>

                <button
                  onClick={() => setFollowing(!following)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    following
                      ? "bg-ds-primary/10 border border-ds-primary text-ds-primary"
                      : "border border-ds-border text-ds-foreground hover:bg-ds-muted"
                  }`}
                >
                  <svg className="w-5 h-5" fill={following ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  {following ? "Following" : "Follow"}
                </button>

                <button className="w-full py-2.5 px-4 rounded-lg font-medium text-sm border border-ds-border text-ds-foreground hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  Share Profile
                </button>
              </div>

              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h3 className="font-semibold text-ds-foreground mb-3">Vendor Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ds-muted-foreground">Products</span>
                    <span className="font-medium text-ds-foreground">{vendor.product_count ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ds-muted-foreground">Rating</span>
                    <span className="font-medium text-ds-foreground">{vendor.rating != null ? vendor.rating.toFixed(1) : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ds-muted-foreground">Reviews</span>
                    <span className="font-medium text-ds-foreground">{vendor.review_count ?? 0}</span>
                  </div>
                  {vendor.created_at && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Member Since</span>
                      <span className="font-medium text-ds-foreground">{new Date(vendor.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {vendor.policies && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Vendor Policies</h3>
                  <ul className="space-y-2 text-sm text-ds-muted-foreground">
                    {vendor.policies.shipping && (
                      <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {vendor.policies.shipping}
                      </li>
                    )}
                    {vendor.policies.returns && (
                      <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {vendor.policies.returns}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VendorProfileBlock />
        <VendorProductsBlock />
      </div>
    </div>
  )
}
