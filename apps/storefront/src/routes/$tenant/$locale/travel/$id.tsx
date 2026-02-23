// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { MapBlock } from '@/components/blocks/map-block'
import { ImageGalleryBlock } from '@/components/blocks/image-gallery-block'
import { ReviewListBlock } from '@/components/blocks/review-list-block'

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

export const Route = createFileRoute("/$tenant/$locale/travel/$id")({
  component: TravelDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Travel Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/travel/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

function TravelDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const pkg = loaderData?.item

  if (!pkg) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Package Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This travel package may have been removed or is no longer available.</p>
            <Link to={`${prefix}/travel` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Travel
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
            <Link to={`${prefix}/travel` as any} className="hover:text-ds-foreground transition-colors">Travel</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{pkg.title || pkg.name || pkg.destination}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {pkg.thumbnail || pkg.image ? (
                <img loading="lazy" src={pkg.thumbnail || pkg.image} alt={pkg.title || pkg.destination} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-ds-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{pkg.title || pkg.name || pkg.destination}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {pkg.destination && (
                  <div className="flex items-center gap-1.5 text-sm text-ds-muted-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>{pkg.destination}</span>
                  </div>
                )}
                {pkg.duration && (
                  <div className="flex items-center gap-1.5 text-sm text-ds-muted-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{pkg.duration}</span>
                  </div>
                )}
                {pkg.rating && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-ds-warning" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <span className="text-sm font-medium text-ds-foreground">{pkg.rating}</span>
                    {pkg.review_count && <span className="text-sm text-ds-muted-foreground">({pkg.review_count} reviews)</span>}
                  </div>
                )}
              </div>
            </div>

            {pkg.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Overview</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{pkg.description}</p>
              </div>
            )}

            {pkg.itinerary && pkg.itinerary.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Itinerary</h2>
                <div className="space-y-4">
                  {pkg.itinerary.map((day: any, idx: number) => (
                    <div key={idx} className="relative ps-6 pb-4 border-l-2 border-ds-primary/30 last:pb-0">
                      <div className="absolute -start-[9px] top-0 w-4 h-4 bg-ds-primary rounded-full flex items-center justify-center">
                        <span className="text-[10px] text-ds-primary-foreground font-bold">{idx + 1}</span>
                      </div>
                      <h3 className="font-medium text-ds-foreground text-sm">{day.title || day.name || `Day ${idx + 1}`}</h3>
                      {day.description && (
                        <p className="text-sm text-ds-muted-foreground mt-1">{day.description}</p>
                      )}
                      {day.activities && (
                        <ul className="mt-2 space-y-1">
                          {day.activities.map((activity: string, aIdx: number) => (
                            <li key={aIdx} className="text-sm text-ds-muted-foreground flex items-center gap-2">
                              <svg className="w-3 h-3 text-ds-primary flex-shrink-0" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                              {activity}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pkg.included && pkg.included.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">What's Included</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pkg.included.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                      <svg className="w-4 h-4 text-ds-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pkg.not_included && pkg.not_included.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Not Included</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pkg.not_included.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                      <svg className="w-4 h-4 text-ds-destructive flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pkg.reviews && pkg.reviews.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Traveler Reviews</h2>
                <div className="space-y-4">
                  {pkg.reviews.map((review: any, idx: number) => (
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
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-ds-muted-foreground">Starting from</p>
                  <p className="text-3xl font-bold text-ds-foreground">
                    {pkg.price != null ? `$${Number(pkg.price || 0).toLocaleString()}` : t(locale, 'verticals.contact_pricing')}
                  </p>
                  {pkg.price_per && <p className="text-sm text-ds-muted-foreground">per {pkg.price_per}</p>}
                </div>

                <button className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Book Now
                </button>

                <button className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Inquire
                </button>
              </div>

              {pkg.departure_dates && pkg.departure_dates.length > 0 && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Departure Dates</h3>
                  <div className="space-y-2">
                    {pkg.departure_dates.map((date: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-ds-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium text-ds-foreground text-sm">
                            {typeof date === "string" ? new Date(date).toLocaleDateString() : date.date ? new Date(date.date).toLocaleDateString() : date.label}
                          </p>
                          {date.availability && (
                            <p className="text-xs text-ds-muted-foreground">{date.availability}</p>
                          )}
                        </div>
                        {date.price && (
                          <span className="text-sm font-medium text-ds-primary">${Number(date.price || 0).toLocaleString()}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h3 className="font-semibold text-ds-foreground mb-3">Trip Details</h3>
                <div className="space-y-2 text-sm">
                  {pkg.duration && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Duration</span>
                      <span className="text-ds-foreground font-medium">{pkg.duration}</span>
                    </div>
                  )}
                  {pkg.group_size && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Group Size</span>
                      <span className="text-ds-foreground font-medium">{pkg.group_size}</span>
                    </div>
                  )}
                  {pkg.difficulty && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Difficulty</span>
                      <span className="text-ds-foreground font-medium">{pkg.difficulty}</span>
                    </div>
                  )}
                  {pkg.accommodation && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Accommodation</span>
                      <span className="text-ds-foreground font-medium">{pkg.accommodation}</span>
                    </div>
                  )}
                  {pkg.meals && (
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Meals</span>
                      <span className="text-ds-foreground font-medium">{pkg.meals}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MapBlock latitude={pkg.latitude} longitude={pkg.longitude} locations={[]} />
        <ImageGalleryBlock images={pkg.images} />
        <ReviewListBlock productId={pkg.id} />
      </div>
    </div>
  )
}
