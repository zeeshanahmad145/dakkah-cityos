// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ReviewListBlock } from "@/components/blocks/review-list-block"

function normalizeDetail(item: any) {
  if (!item) return null
  const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {})
  return { ...meta, ...item,
    thumbnail: item.thumbnail || item.photo_url || item.banner_url || item.logo_url || meta.thumbnail || (meta.images && meta.images[0]) || null,
    images: meta.images || [item.photo_url || item.banner_url || item.logo_url].filter(Boolean),
    description: item.description || meta.description || "",
    price: item.price ?? meta.price ?? null,
    rating: item.rating ?? item.avg_rating ?? meta.rating ?? null,
    review_count: item.review_count ?? meta.review_count ?? null,
    location: item.location || item.city || item.address || meta.location || null,
  }
}

export const Route = createFileRoute("/$tenant/$locale/dropshipping/$id")({
  component: DropshippingDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Dropshipping Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/dropshipping/${params.id}`, {
        headers: { "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_b52dbbf895687445775c819d8cd5cb935f27231ef3a32ade606b58d9e5798d3a" },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

function DropshippingDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const supplier = loaderData?.item

  if (!supplier) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Supplier Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This supplier may no longer be available on the platform.</p>
            <Link to={`${prefix}/dropshipping` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Suppliers
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
            <Link to={`${prefix}/dropshipping` as any} className="hover:text-ds-foreground transition-colors">Dropshipping</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{supplier.name || supplier.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-ds-primary/10 rounded-xl flex items-center justify-center text-ds-primary text-2xl font-bold flex-shrink-0">
                {(supplier.name || supplier.title || "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{supplier.name || supplier.title}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {supplier.rating && (
                    <div className="flex items-center gap-1 text-sm">
                      <svg className="w-4 h-4 text-ds-warning" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <span className="font-medium text-ds-foreground">{supplier.rating}</span>
                    </div>
                  )}
                  {supplier.location && (
                    <span className="text-sm text-ds-muted-foreground flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                      {supplier.location}
                    </span>
                  )}
                  {supplier.product_count && (
                    <span className="text-sm text-ds-muted-foreground">{supplier.product_count} products</span>
                  )}
                </div>
              </div>
            </div>

            {supplier.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">About This Supplier</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{supplier.description}</p>
              </div>
            )}

            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <h2 className="font-semibold text-ds-foreground mb-4">Supplier Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {supplier.shipping_time && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-ds-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                    <div>
                      <p className="text-sm text-ds-muted-foreground">Shipping Time</p>
                      <p className="font-medium text-ds-foreground">{supplier.shipping_time}</p>
                    </div>
                  </div>
                )}
                {supplier.min_order && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-ds-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    <div>
                      <p className="text-sm text-ds-muted-foreground">Minimum Order</p>
                      <p className="font-medium text-ds-foreground">{supplier.min_order}</p>
                    </div>
                  </div>
                )}
                {supplier.return_policy && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-ds-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>
                    <div>
                      <p className="text-sm text-ds-muted-foreground">Return Policy</p>
                      <p className="font-medium text-ds-foreground">{supplier.return_policy}</p>
                    </div>
                  </div>
                )}
                {supplier.categories && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-ds-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    <div>
                      <p className="text-sm text-ds-muted-foreground">Categories</p>
                      <p className="font-medium text-ds-foreground">
                        {Array.isArray(supplier.categories) ? supplier.categories.join(", ") : supplier.categories}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {supplier.products && supplier.products.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Available Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {supplier.products.map((product: any) => (
                    <div key={product.id} className="border border-ds-border rounded-lg p-4 hover:bg-ds-muted/50 transition-colors">
                      <p className="font-medium text-ds-foreground">{product.name || product.title}</p>
                      {product.price && <p className="text-sm text-ds-primary font-semibold mt-1">${Number(product.price || 0).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                <button className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Contact Supplier
                </button>

                <button className="w-full py-2.5 px-4 rounded-lg font-medium text-sm border border-ds-border text-ds-foreground hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                  Add to Partners
                </button>
              </div>

              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h3 className="font-semibold text-ds-foreground mb-3">Why Dropship?</h3>
                <ul className="space-y-2 text-sm text-ds-muted-foreground">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    No inventory required
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Supplier ships directly
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Low startup costs
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReviewListBlock productId={supplier.id} />
      </div>
    </div>
  )
}