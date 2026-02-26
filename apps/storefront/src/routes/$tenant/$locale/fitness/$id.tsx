// @ts-nocheck
import { useState } from "react"
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { useToast } from "@/components/ui/toast"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { FitnessClassScheduleBlock } from '@/components/blocks/fitness-class-schedule-block'
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

export const Route = createFileRoute("/$tenant/$locale/fitness/$id")({
  component: FitnessDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Fitness Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/fitness/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

function FitnessDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const toast = useToast()
  const [bookLoading, setBookLoading] = useState(false)

  const loaderData = Route.useLoaderData()
  const item = loaderData?.item

  const handleBookClass = async () => {
    setBookLoading(true)
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetch(`${baseUrl}/store/fitness/classes/${id}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": getMedusaPublishableKey() },
        credentials: "include",
        body: JSON.stringify({ class_id: id })
      })
      if (resp.ok) toast.success("Class booked!")
      else toast.error("Something went wrong. Please try again.")
    } catch { toast.error("Network error. Please try again.") }
    finally { setBookLoading(false) }
  }

  const handleFreeTrial = () => {
    toast.success("Free trial started!")
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Class Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This fitness class or membership may have been removed or is no longer available.</p>
            <Link to={`${prefix}/fitness` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Fitness
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
            <Link to={`${prefix}/fitness` as any} className="hover:text-ds-foreground transition-colors">Fitness</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{item.name || item.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {item.thumbnail || item.image ? (
                <img loading="lazy" src={item.thumbnail || item.image} alt={item.name || item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-ds-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {item.type && (
                <span className="absolute top-4 start-4 px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary text-ds-primary-foreground">{item.type}</span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{item.name || item.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {item.instructor && (
                  <div className="flex items-center gap-1.5 text-sm text-ds-muted-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span>{item.instructor}</span>
                  </div>
                )}
                {item.duration && (
                  <div className="flex items-center gap-1.5 text-sm text-ds-muted-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{item.duration}</span>
                  </div>
                )}
                {item.level && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-ds-muted text-ds-muted-foreground">{item.level}</span>
                )}
              </div>
            </div>

            {item.location && (
              <div className="flex items-start gap-2 text-sm text-ds-muted-foreground">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>{item.location}</span>
              </div>
            )}

            {item.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">About This Class</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
              </div>
            )}

            {item.schedule && item.schedule.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Class Schedule</h2>
                <div className="space-y-2">
                  {item.schedule.map((slot: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-ds-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-ds-foreground text-sm">{slot.day || slot.date}</p>
                        <p className="text-xs text-ds-muted-foreground">{slot.time}</p>
                      </div>
                      {slot.spots_available != null && (
                        <span className="text-xs text-ds-muted-foreground">{slot.spots_available} spots left</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.benefits && item.benefits.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Benefits</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.benefits.map((benefit: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                      <svg className="w-4 h-4 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {benefit}
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
                  {item.price != null ? `$${Number(item.price || 0).toLocaleString()}` : t(locale, 'verticals.contact_pricing')}
                </p>
                {item.price_period && (
                  <p className="text-sm text-ds-muted-foreground text-center">per {item.price_period}</p>
                )}

                <button onClick={handleBookClass} disabled={bookLoading} className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {bookLoading ? "Booking..." : "Book Class"}
                </button>

                <button onClick={handleFreeTrial} className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors">
                  Free Trial
                </button>
              </div>

              {item.membership_options && item.membership_options.length > 0 && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Membership Options</h3>
                  <div className="space-y-3">
                    {item.membership_options.map((opt: any, idx: number) => (
                      <div key={idx} className="p-3 border border-ds-border rounded-lg hover:border-ds-primary transition-colors cursor-pointer">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-ds-foreground text-sm">{opt.name}</p>
                          <p className="font-bold text-ds-primary text-sm">${Number(opt.price || 0).toLocaleString()}</p>
                        </div>
                        {opt.description && (
                          <p className="text-xs text-ds-muted-foreground mt-1">{opt.description}</p>
                        )}
                        {opt.period && (
                          <p className="text-xs text-ds-muted-foreground">per {opt.period}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {item.instructor_info && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Instructor</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-ds-primary/10 rounded-full flex items-center justify-center text-ds-primary font-semibold">
                      {(item.instructor_info.name || item.instructor || "I").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-ds-foreground">{item.instructor_info.name || item.instructor}</p>
                      {item.instructor_info.specialty && (
                        <p className="text-sm text-ds-muted-foreground">{item.instructor_info.specialty}</p>
                      )}
                    </div>
                  </div>
                  {item.instructor_info.bio && (
                    <p className="text-sm text-ds-muted-foreground mt-3">{item.instructor_info.bio}</p>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FitnessClassScheduleBlock facilityId={item.facility_id || item.id} />
        <ReviewListBlock productId={item.id} />
      </div>
    </div>
  )
}
