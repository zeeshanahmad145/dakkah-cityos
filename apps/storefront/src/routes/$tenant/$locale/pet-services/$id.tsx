// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { PetProfileCardBlock } from "@/components/blocks/pet-profile-card-block"
import { ReviewListBlock } from "@/components/blocks/review-list-block"
import { AppointmentSlotsBlock } from "@/components/blocks/appointment-slots-block"

function normalizeDetail(item: any) {
  if (!item) return null
  let meta = {}
  try { meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {}) } catch { meta = {} }
  return {
    ...meta,
    ...item,
    thumbnail: item.thumbnail || item.image_url || item.photo_url || item.banner_url || item.logo_url || meta.thumbnail || (meta.images && meta.images[0]) || null,
    images: meta.images || [item.photo_url || item.banner_url || item.logo_url].filter(Boolean),
    description: item.description || meta.description || "",
    price: item.price ?? meta.price ?? null,
    rating: item.rating ?? item.avg_rating ?? meta.rating ?? null,
    review_count: item.review_count ?? meta.review_count ?? null,
    location: item.location || item.city || item.address || meta.location || null,
  }
}

export const Route = createFileRoute("/$tenant/$locale/pet-services/$id")({
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/pet-services/${params.id}`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch {
      return { item: null }
    }
  },
  component: PetServiceDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Pet Service Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
})

function PetServiceDetailPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const loaderData = Route.useLoaderData()
  const service = loaderData?.item

  const typeLabels: Record<string, string> = {
    grooming: "Grooming",
    boarding: "Boarding",
    vet: "Veterinary",
    training: "Training",
    walking: "Dog Walking",
    sitting: "Pet Sitting",
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Service Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This pet service may have been removed or is no longer available.</p>
            <Link to={`${prefix}/pet-services` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Pet Services
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
            <Link to={`${prefix}/pet-services` as any} className="hover:text-ds-foreground transition-colors">Pet Services</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{service.name || service.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {service.thumbnail ? (
                <img loading="lazy" src={service.thumbnail} alt={service.name || service.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-ds-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {service.type && (
                <span className="absolute top-4 start-4 px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary text-ds-primary-foreground">{typeLabels[service.type] || service.type}</span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{service.name || service.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {service.species && (
                  <div className="flex items-center gap-1.5 text-sm text-ds-muted-foreground">
                    <span className="text-lg">{service.species === 'dog' ? '🐕' : service.species === 'cat' ? '🐱' : service.species === 'bird' ? '🦅' : '🐾'}</span>
                    <span>{service.species} &middot; {service.breed}</span>
                  </div>
                )}
                {service.rating && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-ds-warning" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <span className="text-sm font-medium text-ds-foreground">{service.rating}</span>
                    {service.review_count && <span className="text-sm text-ds-muted-foreground">({service.review_count} reviews)</span>}
                  </div>
                )}
                {service.location && (
                  <div className="flex items-center gap-1.5 text-sm text-ds-muted-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>{service.location}</span>
                  </div>
                )}
              </div>
            </div>

            {service.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">About</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{service.description}</p>
              </div>
            )}

            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <h2 className="font-semibold text-ds-foreground mb-4">Details</h2>
              <div className="grid grid-cols-2 gap-4">
                {service.species && (
                  <div>
                    <p className="text-xs text-ds-muted-foreground">Species</p>
                    <p className="text-sm font-medium text-ds-foreground capitalize">{service.species}</p>
                  </div>
                )}
                {service.breed && (
                  <div>
                    <p className="text-xs text-ds-muted-foreground">Breed</p>
                    <p className="text-sm font-medium text-ds-foreground">{service.breed}</p>
                  </div>
                )}
                {service.gender && (
                  <div>
                    <p className="text-xs text-ds-muted-foreground">Gender</p>
                    <p className="text-sm font-medium text-ds-foreground capitalize">{service.gender}</p>
                  </div>
                )}
                {service.color && (
                  <div>
                    <p className="text-xs text-ds-muted-foreground">Color</p>
                    <p className="text-sm font-medium text-ds-foreground">{service.color}</p>
                  </div>
                )}
                {service.weight_kg && (
                  <div>
                    <p className="text-xs text-ds-muted-foreground">Weight</p>
                    <p className="text-sm font-medium text-ds-foreground">{service.weight_kg} kg</p>
                  </div>
                )}
                {service.date_of_birth && (
                  <div>
                    <p className="text-xs text-ds-muted-foreground">Date of Birth</p>
                    <p className="text-sm font-medium text-ds-foreground">{new Date(service.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                )}
              </div>
            </div>

            {service.packages && service.packages.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Service Packages</h2>
                <div className="space-y-3">
                  {service.packages.map((pkg: any, idx: number) => (
                    <div key={idx} className="p-4 border border-ds-border rounded-lg hover:border-ds-primary transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-ds-foreground">{typeof pkg === "string" ? pkg : pkg.name}</p>
                          {pkg.description && <p className="text-xs text-ds-muted-foreground mt-1">{pkg.description}</p>}
                        </div>
                        {pkg.price != null && <p className="font-bold text-ds-primary">${Number(pkg.price || 0).toLocaleString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                {service.price != null && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-ds-foreground">${Number(service.price || 0).toLocaleString()}</p>
                  </div>
                )}

                <button className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Book Appointment
                </button>

                <button className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Contact Provider
                </button>
              </div>

              {(service.is_neutered !== null || service.microchip_id || service.vaccinations) && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Health Info</h3>
                  <div className="space-y-2">
                    {service.is_neutered !== null && (
                      <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                        <svg className="w-4 h-4 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        Neutered: {service.is_neutered ? 'Yes' : 'No'}
                      </div>
                    )}
                    {service.microchip_id && (
                      <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                        <svg className="w-4 h-4 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        Microchip: {service.microchip_id}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PetProfileCardBlock />
        <AppointmentSlotsBlock providerId={service.id} />
        <ReviewListBlock productId={service.id} />
      </div>
    </div>
  )
}
