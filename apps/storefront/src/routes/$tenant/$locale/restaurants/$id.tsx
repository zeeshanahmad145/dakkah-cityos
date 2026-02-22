// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { MenuDisplayBlock } from "@/components/blocks/menu-display-block"
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

export const Route = createFileRoute("/$tenant/$locale/restaurants/$id")({
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/restaurants/${params.id}`, {
        headers: { "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_b52dbbf895687445775c819d8cd5cb935f27231ef3a32ade606b58d9e5798d3a" },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
  component: RestaurantDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Restaurant Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
})

function RestaurantDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const restaurant = loaderData?.item

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Restaurant Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This restaurant listing may have been removed or is no longer available.</p>
            <Link to={`${prefix}/restaurants` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Restaurants
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const priceDisplay = restaurant.price_range ? "$".repeat(restaurant.price_range) : null

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <Link to={`${prefix}/restaurants` as any} className="hover:text-ds-foreground transition-colors">Restaurants</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{restaurant.name || restaurant.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {restaurant.thumbnail || restaurant.image ? (
                <img loading="lazy" src={restaurant.thumbnail || restaurant.image} alt={restaurant.name || restaurant.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-ds-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{restaurant.name || restaurant.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {restaurant.cuisine && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-ds-primary/10 text-ds-primary">{restaurant.cuisine}</span>
                )}
                {priceDisplay && (
                  <span className="text-sm text-ds-muted-foreground">{priceDisplay}</span>
                )}
                {restaurant.rating && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-ds-warning" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <span className="text-sm font-medium text-ds-foreground">{restaurant.rating}</span>
                    {restaurant.review_count && (
                      <span className="text-sm text-ds-muted-foreground">({restaurant.review_count} reviews)</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {restaurant.address && (
              <div className="flex items-start gap-2 text-sm text-ds-muted-foreground">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>{restaurant.address}</span>
              </div>
            )}

            {restaurant.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">About</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{restaurant.description}</p>
              </div>
            )}

            {restaurant.menu && restaurant.menu.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Menu</h2>
                <div className="space-y-6">
                  {restaurant.menu.map((section: any, idx: number) => (
                    <div key={idx}>
                      <h3 className="text-sm font-semibold text-ds-foreground mb-3 uppercase tracking-wide">{section.category || section.name}</h3>
                      <div className="space-y-3">
                        {(section.items || []).map((menuItem: any, mIdx: number) => (
                          <div key={mIdx} className="flex items-start justify-between gap-4 py-2 border-b border-ds-border last:border-0">
                            <div>
                              <p className="font-medium text-ds-foreground text-sm">{menuItem.name}</p>
                              {menuItem.description && (
                                <p className="text-xs text-ds-muted-foreground mt-0.5">{menuItem.description}</p>
                              )}
                            </div>
                            {menuItem.price != null && (
                              <span className="text-sm font-medium text-ds-foreground whitespace-nowrap">${Number(menuItem.price).toFixed(2)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {restaurant.reviews && restaurant.reviews.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Reviews</h2>
                <div className="space-y-4">
                  {restaurant.reviews.map((review: any, idx: number) => (
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
                <button className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Reserve a Table
                </button>

                <button className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  Order Online
                </button>

                <button className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Call Restaurant
                </button>
              </div>

              {restaurant.hours && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Hours</h3>
                  <div className="space-y-2 text-sm">
                    {(Array.isArray(restaurant.hours) ? restaurant.hours : Object.entries(restaurant.hours)).map((entry: any, idx: number) => {
                      const day = Array.isArray(entry) ? entry[0] : entry.day
                      const time = Array.isArray(entry) ? entry[1] : entry.hours || entry.time
                      return (
                        <div key={idx} className="flex justify-between">
                          <span className="text-ds-muted-foreground">{day}</span>
                          <span className="text-ds-foreground font-medium">{time}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {restaurant.features && restaurant.features.length > 0 && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.features.map((feature: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 text-xs font-medium rounded-full bg-ds-muted text-ds-muted-foreground">{feature}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <MenuDisplayBlock restaurantId={restaurant.id} />
          {restaurant.location && (
            <MapBlock locations={[{ id: restaurant.id, name: restaurant.name || restaurant.title, address: restaurant.address || restaurant.location, lat: 0, lng: 0 }]} />
          )}
          <ReviewListBlock productId={restaurant.id} />
        </div>
      </div>
    </div>
  )
}
