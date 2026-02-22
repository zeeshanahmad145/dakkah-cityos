// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { TimelineBlock } from "@/components/blocks/timeline-block"
import { FaqBlock } from "@/components/blocks/faq-block"

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

export const Route = createFileRoute("/$tenant/$locale/government/$id")({
  component: GovernmentDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Government Service Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/government/${params.id}`, {
        headers: { "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_8284bf2e6620fac6cd844648a64e64ed0b4a0cf402d4dfc66725ffc67854d8a6" },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

function GovernmentDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const service = loaderData?.item

  if (!service) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Service Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This government service may have been removed or is no longer available.</p>
            <Link to={`${prefix}/government` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Government Services
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
            <Link to={`${prefix}/government` as any} className="hover:text-ds-foreground transition-colors">Government Services</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{service.name || service.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-ds-primary/10 rounded-xl flex items-center justify-center text-ds-primary flex-shrink-0">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{service.name || service.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {service.department && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary/10 text-ds-primary">{service.department}</span>
                    )}
                    {service.category && (
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-ds-muted text-ds-muted-foreground">{service.category}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {service.processing_time && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">Processing Time</p>
                  <p className="text-lg font-bold text-ds-foreground">{service.processing_time}</p>
                </div>
              )}
              {service.fee != null && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">Fee</p>
                  <p className="text-lg font-bold text-ds-foreground">{Number(service.fee || 0) === 0 ? "Free" : `$${Number(service.fee || 0).toLocaleString()}`}</p>
                </div>
              )}
              {service.availability && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">Availability</p>
                  <p className="text-lg font-bold text-ds-foreground">{service.availability}</p>
                </div>
              )}
            </div>

            {service.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Service Description</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{service.description}</p>
              </div>
            )}

            {service.requirements && service.requirements.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Requirements</h2>
                <div className="space-y-3">
                  {service.requirements.map((req: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-ds-muted/30 rounded-lg">
                      <span className="w-6 h-6 bg-ds-primary/10 rounded-full flex items-center justify-center text-ds-primary text-xs font-semibold flex-shrink-0">{idx + 1}</span>
                      <span className="text-sm text-ds-foreground">{typeof req === "string" ? req : req.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {service.required_documents && service.required_documents.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Required Documents</h2>
                <div className="space-y-2">
                  {service.required_documents.map((doc: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      {typeof doc === "string" ? doc : doc.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {service.steps && service.steps.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">How to Apply</h2>
                <div className="space-y-4">
                  {service.steps.map((step: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="w-8 h-8 bg-ds-primary text-ds-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">{idx + 1}</span>
                      <div>
                        <p className="font-medium text-ds-foreground text-sm">{typeof step === "string" ? step : step.title}</p>
                        {step.description && <p className="text-xs text-ds-muted-foreground mt-0.5">{step.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {service.office_locations && service.office_locations.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Office Locations</h2>
                <div className="space-y-3">
                  {service.office_locations.map((office: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-ds-muted/30 rounded-lg">
                      <svg className="w-5 h-5 text-ds-muted-foreground mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <div>
                        <p className="font-medium text-ds-foreground text-sm">{typeof office === "string" ? office : office.name}</p>
                        {office.address && <p className="text-xs text-ds-muted-foreground mt-0.5">{office.address}</p>}
                        {office.hours && <p className="text-xs text-ds-muted-foreground">{office.hours}</p>}
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
                {service.fee != null && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-ds-foreground">{Number(service.fee || 0) === 0 ? "Free" : `$${Number(service.fee || 0).toLocaleString()}`}</p>
                    <p className="text-sm text-ds-muted-foreground">Service Fee</p>
                  </div>
                )}

                <button className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Apply Online
                </button>

                <button className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download Forms
                </button>
              </div>

              {service.contact && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    {service.contact.phone && (
                      <div className="flex items-center gap-2 text-ds-muted-foreground">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <span>{service.contact.phone}</span>
                      </div>
                    )}
                    {service.contact.email && (
                      <div className="flex items-center gap-2 text-ds-muted-foreground">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span>{service.contact.email}</span>
                      </div>
                    )}
                    {service.contact.website && (
                      <div className="flex items-center gap-2 text-ds-muted-foreground">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                        <span>{service.contact.website}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {service.hours && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Office Hours</h3>
                  <p className="text-sm text-ds-muted-foreground whitespace-pre-wrap">{service.hours}</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TimelineBlock />
        <FaqBlock />
      </div>
    </div>
  )
}
