// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { POIDetail } from "@/components/poi/poi-detail"
import { t } from "@/lib/i18n"
import { MapBlock } from "@/components/blocks/map-block"
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

export const Route = createFileRoute("/$tenant/$locale/places/$id")({
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/content/pois/${params.id}`, {
        headers: { "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_b52dbbf895687445775c819d8cd5cb935f27231ef3a32ade606b58d9e5798d3a" },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
  component: PlaceDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Place Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
})

function PlaceDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const poi = loaderData?.item

  if (!poi) {
    return (
      <div className="min-h-screen bg-ds-muted flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl block mb-4">📍</span>
          <p className="text-ds-muted-foreground mb-4">{t(locale, "common.not_found")}</p>
          <Link
            to={`${prefix}/places` as any}
            className="text-sm text-ds-primary hover:underline"
          >
            {t(locale, "common.back")}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ds-muted">
      <div className="bg-ds-background border-b border-ds-border">
        <div className="content-container py-4">
          <nav className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}/places` as any} className="hover:text-ds-foreground transition-colors">
              {t(locale, "poi.places")}
            </Link>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-ds-foreground">{poi.name}</span>
          </nav>
        </div>
      </div>

      <div className="content-container py-8">
        <div className="max-w-4xl mx-auto">
          <POIDetail poi={poi} locale={locale} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MapBlock />
        <ReviewListBlock productId={poi.id} />
      </div>
    </div>
  )
}
