// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ParkingSpotFinderBlock } from "@/components/blocks/parking-spot-finder-block"
import { MapBlock } from "@/components/blocks/map-block"

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

export const Route = createFileRoute("/$tenant/$locale/parking/$id")({
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/parking/${params.id}`, {
        headers: { "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_8284bf2e6620fac6cd844648a64e64ed0b4a0cf402d4dfc66725ffc67854d8a6" },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
  component: ParkingDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Parking Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
})

function ParkingDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const spot = loaderData?.item

  if (!spot) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Parking Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This parking spot may have been removed or is no longer available.</p>
            <Link to={`${prefix}/parking` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Parking
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const typeLabels: Record<string, string> = {
    garage: "Parking Garage",
    lot: "Parking Lot",
    street: "Street Parking",
    valet: "Valet Parking",
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <Link to={`${prefix}/parking` as any} className="hover:text-ds-foreground transition-colors">Parking</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{spot.name || spot.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {spot.thumbnail || spot.image ? (
                <img loading="lazy" src={spot.thumbnail || spot.image} alt={spot.name || spot.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-ds-muted">
                  <svg className="w-16 h-16 text-ds-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
              {spot.type && (
                <span className="absolute top-4 start-4 px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary text-ds-primary-foreground">{typeLabels[spot.type] || spot.type}</span>
              )}
              {spot.available != null && (
                <span className={`absolute top-4 end-4 px-3 py-1 text-xs font-semibold rounded-full ${spot.available ? "bg-ds-success/20 text-ds-success" : "bg-ds-destructive/20 text-ds-destructive"}`}>
                  {spot.available ? "Available" : "Full"}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{spot.name || spot.title}</h1>
              {spot.location && (
                <div className="flex items-start gap-2 mt-2 text-sm text-ds-muted-foreground">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>{typeof spot.location === "string" ? spot.location : spot.location.address || spot.address}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {spot.hourly_rate != null && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">Hourly</p>
                  <p className="text-lg font-bold text-ds-foreground">${Number(spot.hourly_rate).toFixed(2)}</p>
                </div>
              )}
              {spot.daily_rate != null && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">Daily</p>
                  <p className="text-lg font-bold text-ds-foreground">${Number(spot.daily_rate).toFixed(2)}</p>
                </div>
              )}
              {spot.monthly_rate != null && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">Monthly</p>
                  <p className="text-lg font-bold text-ds-foreground">${Number(spot.monthly_rate || 0).toLocaleString()}</p>
                </div>
              )}
              {spot.total_spaces != null && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">Total Spaces</p>
                  <p className="text-lg font-bold text-ds-foreground">{spot.total_spaces}</p>
                </div>
              )}
            </div>

            {spot.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">About This Parking</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{spot.description}</p>
              </div>
            )}

            {spot.features && spot.features.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Features & Amenities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {spot.features.map((feature: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                      <svg className="w-4 h-4 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {typeof feature === "string" ? feature : feature.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <h2 className="font-semibold text-ds-foreground mb-3">Location</h2>
              <div className="aspect-[16/9] bg-ds-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-12 h-12 text-ds-muted-foreground/30 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                  <p className="text-sm text-ds-muted-foreground">Map view</p>
                </div>
              </div>
            </div>

            {spot.operating_hours && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Operating Hours</h2>
                {Array.isArray(spot.operating_hours) ? (
                  <div className="space-y-2">
                    {spot.operating_hours.map((hours: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 text-sm">
                        <span className="text-ds-foreground font-medium">{typeof hours === "string" ? hours : hours.day}</span>
                        {hours.hours && <span className="text-ds-muted-foreground">{hours.hours}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ds-muted-foreground whitespace-pre-wrap">{spot.operating_hours}</p>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                {spot.hourly_rate != null && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-ds-foreground">${Number(spot.hourly_rate).toFixed(2)}</p>
                    <p className="text-sm text-ds-muted-foreground">per hour</p>
                  </div>
                )}

                <button className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Reserve Spot
                </button>

                <button className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors">
                  Get Directions
                </button>
              </div>

              {spot.rates && spot.rates.length > 0 && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Rate Options</h3>
                  <div className="space-y-2">
                    {spot.rates.map((rate: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-ds-muted/30 rounded-lg">
                        <span className="text-sm text-ds-foreground">{typeof rate === "string" ? rate : rate.label || rate.name}</span>
                        {rate.price != null && <span className="text-sm font-bold text-ds-primary">${Number(rate.price).toFixed(2)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {spot.rules && spot.rules.length > 0 && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Parking Rules</h3>
                  <div className="space-y-2">
                    {spot.rules.map((rule: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                        <svg className="w-4 h-4 text-ds-warning flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                        {typeof rule === "string" ? rule : rule.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ParkingSpotFinderBlock spotId={spot.id} />
        {(spot.latitude || spot.lat || (spot.coordinates && spot.coordinates.lat)) && (
          <MapBlock />
        )}
      </div>
    </div>
  )
}
