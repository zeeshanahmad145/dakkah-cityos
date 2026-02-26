// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { POIDetail } from "@/components/poi/poi-detail"
import { t } from "@/lib/i18n"
import { MapBlock } from "@/components/blocks/map-block"
import { ReviewListBlock } from "@/components/blocks/review-list-block"
import { useState } from "react"
import { useToast } from "@/components/ui/toast"

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

export const Route = createFileRoute("/$tenant/$locale/places/$id")({
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/content/pois/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
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
  const [saved, setSaved] = useState(false)
  const toast = useToast()

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

          <div className="mt-6 bg-ds-background rounded-lg border border-ds-border p-6">
            <h2 className="text-lg font-semibold text-ds-foreground mb-4">Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const address = poi.address || poi.location || poi.name
                  if (address) {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank")
                  } else {
                    toast.info("Address not available for directions.")
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Get Directions
              </button>
              <button
                onClick={() => {
                  setSaved(!saved)
                  toast.success(saved ? "Place removed from saved." : "Place saved successfully!")
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg font-medium transition-colors ${saved ? "bg-ds-primary/10 border-ds-primary text-ds-primary" : "border-ds-border text-ds-foreground hover:bg-ds-muted"}`}
              >
                <svg className="w-5 h-5" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                {saved ? "Saved" : "Save Place"}
              </button>
              <button
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.share) {
                    navigator.share({ title: poi.name, url: window.location.href })
                  } else if (typeof navigator !== "undefined") {
                    navigator.clipboard.writeText(window.location.href)
                    toast.success("Link copied to clipboard!")
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MapBlock />
        <ReviewListBlock productId={poi.id} />
      </div>
    </div>
  )
}
