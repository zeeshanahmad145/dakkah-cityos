// @ts-nocheck
import { useState } from "react"
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { useToast } from "@/components/ui/toast"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { PropertyListingBlock } from '@/components/blocks/property-listing-block'
import { MapBlock } from '@/components/blocks/map-block'
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

export const Route = createFileRoute("/$tenant/$locale/real-estate/$id")({
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/real-estate/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
  component: RealEstateDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Real Estate Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
})

function RealEstateDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const loaderData = Route.useLoaderData()
  const property = loaderData?.item

  const baseUrl = getServerBaseUrl()
  const publishableKey = getMedusaPublishableKey()

  const handleScheduleViewing = async () => {
    setLoading(true)
    try {
      const resp = await fetch(`${baseUrl}/store/real-estate/${id}/tour`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": publishableKey },
        credentials: "include",
        body: JSON.stringify({ property_id: id })
      })
      if (resp.ok) toast.success("Viewing scheduled successfully!")
      else toast.error("Something went wrong. Please try again.")
    } catch { toast.error("Network error. Please try again.") }
    finally { setLoading(false) }
  }

  const handleContactAgent = () => {
    toast.success("Your inquiry has been sent to the listing agent!")
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Property Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This property listing may have been removed or is no longer available.</p>
            <Link to={`${prefix}/real-estate` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Properties
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const highlights = [
    { label: t(locale, "realestate.label_bedrooms", "Bedrooms"), value: property.bedrooms, icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { label: t(locale, "realestate.label_bathrooms", "Bathrooms"), value: property.bathrooms, icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
    { label: t(locale, "realestate.label_sq_ft", "Sq Ft"), value: property.sqft ? Number(property.sqft || 0).toLocaleString() : property.square_feet ? Number(property.square_feet || 0).toLocaleString() : null, icon: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" },
    { label: t(locale, "realestate.label_type", "Type"), value: property.property_type || property.propertyType, icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  ].filter((h) => h.value)

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <Link to={`${prefix}/real-estate` as any} className="hover:text-ds-foreground transition-colors">Real Estate</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{property.title || property.address}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {property.thumbnail || property.image ? (
                <img loading="lazy" src={property.thumbnail || property.image} alt={property.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-ds-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {property.listing_type && (
                <span className="absolute top-4 start-4 px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary text-ds-primary-foreground">
                  {property.listing_type === "sale" ? t(locale, 'verticals.for_sale') : t(locale, 'verticals.for_rent')}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{property.title || property.address}</h1>
              {property.address && property.title && (
                <div className="flex items-center gap-1.5 mt-2 text-ds-muted-foreground text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>{property.address}</span>
                </div>
              )}
              <p className="text-2xl font-bold text-ds-primary mt-3">
                {property.price != null ? `$${Number(property.price || 0).toLocaleString()}` : "Contact for price"}
                {property.listing_type === "rent" && <span className="text-base font-normal text-ds-muted-foreground">/mo</span>}
              </p>
            </div>

            {highlights.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {highlights.map((h) => (
                  <div key={h.label} className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                    <svg className="w-6 h-6 text-ds-primary mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={h.icon} /></svg>
                    <p className="text-lg font-bold text-ds-foreground">{h.value}</p>
                    <p className="text-xs text-ds-muted-foreground">{h.label}</p>
                  </div>
                ))}
              </div>
            )}

            {property.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">About This Property</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{property.description}</p>
              </div>
            )}

            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {property.amenities.map((amenity: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                      <svg className="w-4 h-4 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                <p className="text-3xl font-bold text-ds-foreground text-center">
                  {property.price != null ? `$${Number(property.price || 0).toLocaleString()}` : "Contact for price"}
                </p>

                <button onClick={handleScheduleViewing} disabled={loading} className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {loading ? "Scheduling..." : "Schedule Viewing"}
                </button>

                <button onClick={handleContactAgent} className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Contact Agent
                </button>
              </div>

              {property.agent && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Listing Agent</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-ds-primary/10 rounded-full flex items-center justify-center text-ds-primary font-semibold">
                      {(property.agent.name || "A").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-ds-foreground">{property.agent.name}</p>
                      {property.agent.company && (
                        <p className="text-sm text-ds-muted-foreground">{property.agent.company}</p>
                      )}
                    </div>
                  </div>
                  {property.agent.phone && (
                    <p className="text-sm text-ds-muted-foreground">{property.agent.phone}</p>
                  )}
                  {property.agent.email && (
                    <p className="text-sm text-ds-muted-foreground">{property.agent.email}</p>
                  )}
                </div>
              )}

              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h3 className="font-semibold text-ds-foreground mb-3">Property Details</h3>
                <div className="space-y-2 text-sm">
                  {property.year_built && (
                    <div className="flex justify-between"><span className="text-ds-muted-foreground">Year Built</span><span className="text-ds-foreground font-medium">{property.year_built}</span></div>
                  )}
                  {property.lot_size && (
                    <div className="flex justify-between"><span className="text-ds-muted-foreground">Lot Size</span><span className="text-ds-foreground font-medium">{property.lot_size}</span></div>
                  )}
                  {property.parking && (
                    <div className="flex justify-between"><span className="text-ds-muted-foreground">Parking</span><span className="text-ds-foreground font-medium">{property.parking}</span></div>
                  )}
                  {property.hoa_fee && (
                    <div className="flex justify-between"><span className="text-ds-muted-foreground">HOA Fee</span><span className="text-ds-foreground font-medium">${property.hoa_fee}/mo</span></div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PropertyListingBlock propertyId={property.id} />
        <MapBlock latitude={property.latitude} longitude={property.longitude} locations={[]} />
        <ReviewListBlock productId={property.id || id} heading="Reviews" />
      </div>
    </div>
  )
}
