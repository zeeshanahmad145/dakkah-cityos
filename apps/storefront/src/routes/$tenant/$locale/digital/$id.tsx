// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ReviewListBlock } from "@/components/blocks/review-list-block"
import { t, formatCurrency, type SupportedLocale } from "@/lib/i18n"
import { Star } from "@medusajs/icons"

function normalizeDetail(item: any) {
  if (!item) return null
  const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {})
  const rawRating = item.rating ?? item.avg_rating ?? meta.rating ?? null
  const rawReviewCount = item.review_count ?? meta.review_count ?? null
  const ratingObj = rawRating != null
    ? (typeof rawRating === 'object' && rawRating.average != null ? rawRating : { average: Number(rawRating), count: Number(rawReviewCount || 0) })
    : null
  return { ...meta, ...item,
    thumbnail: item.thumbnail || item.photo_url || item.banner_url || item.logo_url || meta.thumbnail || (meta.images && meta.images[0]) || null,
    images: meta.images || [item.photo_url || item.banner_url || item.logo_url].filter(Boolean),
    description: item.description || meta.description || "",
    price: item.price ?? meta.price ?? null,
    currency_code: item.currency_code || item.currency || meta.currency_code || meta.currency || "USD",
    file_type: item.file_type || meta.file_type || null,
    file_size: item.file_size || meta.file_size || null,
    rating: ratingObj,
    review_count: rawReviewCount,
    location: item.location || item.city || item.address || meta.location || null,
  }
}

export const Route = createFileRoute("/$tenant/$locale/digital/$id")({
  component: DigitalProductDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Digital Product Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/digital-products/${params.id}`, {
        headers: { "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_8284bf2e6620fac6cd844648a64e64ed0b4a0cf402d4dfc66725ffc67854d8a6" },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

function DigitalProductDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const product = loaderData?.item

  if (!product) {
    return (
      <div className="min-h-screen bg-ds-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-ds-destructive mb-4">Product not found</p>
          <Link to={`${prefix}/digital` as any} className="text-ds-primary hover:underline">
            Back to Digital Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">
              {t(locale, "common.home")}
            </Link>
            <span>/</span>
            <Link to={`${prefix}/digital` as any} className="hover:text-ds-foreground transition-colors">
              Digital Products
            </Link>
            <span>/</span>
            <span className="text-ds-foreground">{product.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="aspect-[4/3] bg-ds-muted rounded-lg overflow-hidden">
              {product.thumbnail ? (
                <img loading="lazy" src={product.thumbnail} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-24 h-24 text-ds-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {product.preview_url && (
              <a
                href={product.preview_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-ds-muted text-ds-foreground text-sm font-medium rounded-lg hover:bg-ds-accent transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </a>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              {product.file_type && <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-ds-muted text-ds-muted-foreground">
                {product.file_type.toUpperCase()}
              </span>}
              {product.category && (
                <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-ds-muted text-ds-muted-foreground">
                  {product.category}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-ds-foreground">{product.title}</h1>

            {product.vendor_name && (
              <p className="text-sm text-ds-muted-foreground mt-2">
                By {product.vendor_name}
              </p>
            )}

            {product.rating && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(product.rating!.average) ? "text-ds-warning" : "text-ds-muted"}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-ds-foreground">{product.rating.average.toFixed(1)}</span>
                <span className="text-sm text-ds-muted-foreground">({product.rating.count} reviews)</span>
              </div>
            )}

            <div className="mt-6">
              <span className="text-4xl font-bold text-ds-foreground">
                {formatCurrency(product.price, product.currency_code, locale as SupportedLocale)}
              </span>
            </div>

            {product.description && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-ds-foreground mb-2">Description</h2>
                <p className="text-ds-muted-foreground leading-relaxed">{product.description}</p>
              </div>
            )}

            <div className="mt-6 p-4 bg-ds-muted rounded-lg">
              <h3 className="text-sm font-semibold text-ds-foreground mb-3">File Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-ds-muted-foreground">Type</span>
                  <p className="font-medium text-ds-foreground">{product.file_type ? product.file_type.toUpperCase() : "—"}</p>
                </div>
                <div>
                  <span className="text-ds-muted-foreground">Size</span>
                  <p className="font-medium text-ds-foreground">{product.file_size}</p>
                </div>
                {product.format && (
                  <div>
                    <span className="text-ds-muted-foreground">Format</span>
                    <p className="font-medium text-ds-foreground">{product.format}</p>
                  </div>
                )}
              </div>
            </div>

            <button className="w-full mt-6 px-6 py-3 bg-ds-primary text-ds-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity text-lg">
              Purchase Now
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReviewListBlock productId={product.id} />
      </div>
    </div>
  )
}
