// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { HealthcareProviderBlock } from '@/components/blocks/healthcare-provider-block'
import { AppointmentSlotsBlock } from '@/components/blocks/appointment-slots-block'

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

export const Route = createFileRoute("/$tenant/$locale/healthcare/$id")({
  component: HealthcareDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Healthcare Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/healthcare/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

function HealthcareDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const provider = loaderData?.item

  if (!provider) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Provider Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This healthcare provider may have been removed or is no longer available.</p>
            <Link to={`${prefix}/healthcare` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Healthcare
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
            <Link to={`${prefix}/healthcare` as any} className="hover:text-ds-foreground transition-colors">Healthcare</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{provider.name || provider.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-ds-primary/10 rounded-xl flex items-center justify-center text-ds-primary flex-shrink-0">
                  {provider.thumbnail || provider.image ? (
                    <img loading="lazy" src={provider.thumbnail || provider.image} alt={provider.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{provider.name || provider.title}</h1>
                  {provider.specialty && (
                    <p className="text-ds-primary font-medium mt-1">{provider.specialty}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {provider.rating && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-ds-warning" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        <span className="text-sm font-medium text-ds-foreground">{provider.rating}</span>
                        {provider.review_count && <span className="text-sm text-ds-muted-foreground">({provider.review_count} reviews)</span>}
                      </div>
                    )}
                    {provider.experience && (
                      <span className="text-sm text-ds-muted-foreground">{provider.experience} years experience</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {provider.location && (
              <div className="flex items-start gap-2 text-sm text-ds-muted-foreground">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>{provider.location || provider.address}</span>
              </div>
            )}

            {provider.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">About</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{provider.description}</p>
              </div>
            )}

            {provider.services && provider.services.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Services</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {provider.services.map((service: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm p-3 bg-ds-muted/30 rounded-lg">
                      <svg className="w-4 h-4 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span className="text-ds-foreground">{typeof service === "string" ? service : service.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {provider.insurance_accepted && provider.insurance_accepted.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Insurance Accepted</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.insurance_accepted.map((ins: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 text-xs font-medium rounded-full bg-ds-muted text-ds-muted-foreground">{ins}</span>
                  ))}
                </div>
              </div>
            )}

            {provider.reviews && provider.reviews.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Patient Reviews</h2>
                <div className="space-y-4">
                  {provider.reviews.map((review: any, idx: number) => (
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
                  Book Appointment
                </button>

                <button className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Call Office
                </button>

                <button className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Virtual Visit
                </button>
              </div>

              {provider.availability && provider.availability.length > 0 && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Available Appointments</h3>
                  <div className="space-y-2">
                    {provider.availability.map((slot: any, idx: number) => (
                      <button key={idx} className="w-full text-start px-3 py-2 text-sm rounded-lg border border-ds-border hover:border-ds-primary hover:bg-ds-primary/5 transition-colors">
                        <p className="font-medium text-ds-foreground">{slot.date || slot.day}</p>
                        <p className="text-xs text-ds-muted-foreground">{slot.time || slot.hours}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {provider.credentials && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Credentials</h3>
                  <div className="space-y-2 text-sm">
                    {(Array.isArray(provider.credentials) ? provider.credentials : [provider.credentials]).map((cred: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-ds-muted-foreground">
                        <svg className="w-4 h-4 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        <span>{typeof cred === "string" ? cred : cred.name}</span>
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
        <HealthcareProviderBlock providerId={provider.id} />
        <AppointmentSlotsBlock providerId={provider.id} />
      </div>
    </div>
  )
}
