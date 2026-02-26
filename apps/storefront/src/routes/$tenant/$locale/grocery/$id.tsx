// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { useToast } from "@/components/ui/toast"
import { ReviewListBlock } from "@/components/blocks/review-list-block"
import { ComparisonTableBlock } from "@/components/blocks/comparison-table-block"

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

export const Route = createFileRoute("/$tenant/$locale/grocery/$id")({
  component: GroceryDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Grocery Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/grocery/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

function GroceryDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [quantity, setQuantity] = useState(1)

  const loaderData = Route.useLoaderData()
  const product = loaderData?.item
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleAddToCart = async () => {
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 500))
      toast.success(`${quantity} item${quantity > 1 ? "s" : ""} added to cart!`)
    } catch { toast.error("Something went wrong. Please try again.") }
    finally { setLoading(false) }
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Product Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This grocery product may have been removed or is no longer available.</p>
            <Link to={`${prefix}/grocery` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Grocery
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
            <Link to={`${prefix}/grocery` as any} className="hover:text-ds-foreground transition-colors">Grocery</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{product.name || product.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-square sm:aspect-[4/3] bg-ds-muted rounded-xl overflow-hidden">
              {product.thumbnail || product.image ? (
                <img loading="lazy" src={product.thumbnail || product.image} alt={product.name || product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-ds-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {product.organic && (
                <span className="absolute top-4 start-4 px-3 py-1 text-xs font-semibold rounded-full bg-ds-success/20 text-ds-success">Organic</span>
              )}
              {product.category && (
                <span className="absolute top-4 end-4 px-3 py-1 text-xs font-medium rounded-full bg-ds-background/80 text-ds-foreground backdrop-blur-sm">{product.category}</span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{product.name || product.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {product.brand && (
                  <span className="text-sm text-ds-muted-foreground">Brand: <span className="font-medium text-ds-foreground">{product.brand}</span></span>
                )}
                {product.weight && (
                  <span className="text-sm text-ds-muted-foreground">{product.weight}</span>
                )}
                {product.volume && (
                  <span className="text-sm text-ds-muted-foreground">{product.volume}</span>
                )}
                {product.unit_size && (
                  <span className="text-sm text-ds-muted-foreground">{product.unit_size}</span>
                )}
              </div>
            </div>

            {product.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Description</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {product.nutrition && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Nutrition Information</h2>
                {typeof product.nutrition === "object" && !Array.isArray(product.nutrition) ? (
                  <div className="space-y-2">
                    {Object.entries(product.nutrition).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between p-2 text-sm border-b border-ds-border last:border-0">
                        <span className="text-ds-foreground capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="font-medium text-ds-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : Array.isArray(product.nutrition) ? (
                  <div className="space-y-2">
                    {product.nutrition.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 text-sm border-b border-ds-border last:border-0">
                        <span className="text-ds-foreground">{typeof item === "string" ? item : item.name}</span>
                        {item.value && <span className="font-medium text-ds-foreground">{item.value}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ds-muted-foreground whitespace-pre-wrap">{product.nutrition}</p>
                )}
              </div>
            )}

            {product.ingredients && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Ingredients</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed">
                  {Array.isArray(product.ingredients) ? product.ingredients.join(", ") : product.ingredients}
                </p>
              </div>
            )}

            {product.allergens && product.allergens.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Allergen Information</h2>
                <div className="flex flex-wrap gap-2">
                  {product.allergens.map((allergen: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 text-xs font-medium rounded-full bg-ds-warning/20 text-ds-warning">{allergen}</span>
                  ))}
                </div>
              </div>
            )}

            {product.related_products && product.related_products.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Related Products</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {product.related_products.map((related: any, idx: number) => (
                    <div key={idx} className="p-3 border border-ds-border rounded-lg">
                      <p className="text-sm font-medium text-ds-foreground truncate">{typeof related === "string" ? related : related.name}</p>
                      {related.price != null && <p className="text-sm text-ds-primary font-bold mt-1">${Number(related.price || 0).toFixed(2)}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                {product.price != null && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-ds-foreground">${Number(product.price || 0).toFixed(2)}</p>
                    {product.price_per_unit && (
                      <p className="text-sm text-ds-muted-foreground">{product.price_per_unit}</p>
                    )}
                  </div>
                )}

                {product.in_stock != null && (
                  <div className="text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${product.in_stock ? "bg-ds-success/20 text-ds-success" : "bg-ds-destructive/20 text-ds-destructive"}`}>
                      {product.in_stock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-ds-border flex items-center justify-center text-ds-foreground hover:bg-ds-muted transition-colors"
                  >
                    -
                  </button>
                  <span className="text-lg font-semibold text-ds-foreground w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg border border-ds-border flex items-center justify-center text-ds-foreground hover:bg-ds-muted transition-colors"
                  >
                    +
                  </button>
                </div>

                <button onClick={handleAddToCart} disabled={loading} className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                  {loading ? "Adding..." : "Add to Cart"}
                </button>
              </div>

              {product.dietary && product.dietary.length > 0 && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Dietary Info</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.dietary.map((diet: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 text-xs font-medium rounded-full bg-ds-success/10 text-ds-success">{diet}</span>
                    ))}
                  </div>
                </div>
              )}

              {product.storage && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Storage Instructions</h3>
                  <p className="text-sm text-ds-muted-foreground">{product.storage}</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReviewListBlock productId={product.id} />
        <ComparisonTableBlock />
      </div>
    </div>
  )
}
