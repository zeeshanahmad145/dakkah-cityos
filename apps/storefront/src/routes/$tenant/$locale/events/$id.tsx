// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { t } from "@/lib/i18n"
import { formatCurrency } from "@/lib/i18n"
import { TicketSelector } from "@/components/events/ticket-selector"
import { EventCountdown } from "@/components/events/event-countdown"
import { useState } from "react"
import { EventScheduleBlock } from "@/components/blocks/event-schedule-block"
import { ReviewListBlock } from "@/components/blocks/review-list-block"

function normalizeDetail(item: any) {
  if (!item) return null
  const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {})
  const rawPrice = item.price ?? meta.price ?? null
  const currency = item.currency || item.currency_code || meta.currency || meta.currency_code || "USD"
  return { ...meta, ...item,
    thumbnail: item.thumbnail || item.image_url || item.photo_url || item.banner_url || item.logo_url || meta.thumbnail || (meta.images && meta.images[0]) || null,
    images: meta.images || [item.photo_url || item.banner_url || item.logo_url].filter(Boolean),
    description: item.description || meta.description || "",
    price: rawPrice,
    currency,
    date: item.start_date || item.event_date || item.date || meta.start_date || meta.event_date || meta.date || null,
    end_date: item.end_date || meta.end_date || null,
    isFree: item.isFree ?? item.is_free ?? meta.isFree ?? meta.is_free ?? false,
    rating: item.rating ?? item.avg_rating ?? meta.rating ?? null,
    review_count: item.review_count ?? meta.review_count ?? null,
    location: item.location || item.city || item.address || meta.location || null,
    venue: item.venue || meta.venue || null,
    ticketTypes: item.ticketTypes || item.ticket_types || meta.ticketTypes || meta.ticket_types || null,
  }
}

export const Route = createFileRoute("/$tenant/$locale/events/$id")({
  component: EventDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Event Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/events/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

const statusStyles: Record<string, string> = {
  upcoming: "bg-ds-primary/20 text-ds-primary",
  ongoing: "bg-ds-success/20 text-ds-success",
  ended: "bg-ds-muted text-ds-muted-foreground",
  cancelled: "bg-ds-destructive/20 text-ds-destructive",
  "sold-out": "bg-ds-warning/20 text-ds-warning",
}

function EventDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const event = loaderData?.item
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({})

  if (!event) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg
              className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">
              {t(locale, "common.not_found")}
            </h2>
            <p className="text-ds-muted-foreground mb-6">
              {t(locale, "events.no_events")}
            </p>
            <Link
              to={`${prefix}/events` as any}
              className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors"
            >
              {t(locale, "events.browse_events")}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const eventDateRaw = event.date || event.start_date || event.event_date
  const eventDate = eventDateRaw ? new Date(eventDateRaw) : null
  const validDate = eventDate && !isNaN(eventDate.getTime())
  const dateLocale = locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US"
  const formattedDate = validDate
    ? eventDate.toLocaleDateString(dateLocale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : ""
  const formattedTime = validDate
    ? eventDate.toLocaleTimeString(dateLocale, { hour: "numeric", minute: "2-digit" })
    : ""

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">
              {t(locale, "common.home")}
            </Link>
            <span>/</span>
            <Link
              to={`${prefix}/events` as any}
              className="hover:text-ds-foreground transition-colors"
            >
              {t(locale, "events.title")}
            </Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{event.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {event.thumbnail ? (
                <img
                  src={event.thumbnail}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-ds-muted-foreground/30"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}

              <div className="absolute top-4 start-4 flex gap-2">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    statusStyles[event.status] || statusStyles.upcoming
                  }`}
                >
                  {event.status === "sold-out"
                    ? t(locale, "events.sold_out")
                    : event.status}
                </span>
                {event.category && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-ds-background/80 text-ds-foreground backdrop-blur-sm">
                    {event.category}
                  </span>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-ds-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-ds-foreground">{formattedDate}</p>
                    <p className="text-xs text-ds-muted-foreground">{formattedTime}</p>
                  </div>
                </div>

                {event.isFree ? (
                  <span className="text-sm font-semibold text-ds-success">
                    {t(locale, "events.free_event")}
                  </span>
                ) : event.price ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-ds-muted-foreground">
                      {t(locale, "product.price")}:
                    </span>
                    <span className="text-sm font-medium text-ds-foreground">
                      {typeof event.price === 'object' && event.price !== null
                        ? formatCurrency(event.price.amount, event.price.currencyCode, locale as any)
                        : formatCurrency(Number(event.price), event.currency || "USD", locale as any)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {(event.status === "upcoming" || event.status === "ongoing") && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4 text-center">
                  {t(locale, "events.upcoming_events")}
                </h2>
                <EventCountdown
                  date={event.date || event.start_date}
                  locale={locale}
                  size="md"
                />
              </div>
            )}

            {event.venue && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">
                  {t(locale, "events.venue")}
                </h2>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-ds-muted-foreground mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-ds-foreground">{event.venue.name}</p>
                    {event.venue.address && (
                      <p className="text-sm text-ds-muted-foreground mt-0.5">{event.venue.address}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {event.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">
                  {t(locale, "product.description")}
                </h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            <div className="block lg:hidden">
              {event.ticketTypes && event.ticketTypes.length > 0 && (
                <TicketSelector
                  locale={locale}
                  ticketTypes={event.ticketTypes}
                  selectedTickets={selectedTickets}
                  onSelectionChange={setSelectedTickets}
                />
              )}
            </div>

            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <h2 className="font-semibold text-ds-foreground mb-3">Share</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.share) {
                      navigator.share({ title: event.title, url: window.location.href })
                    } else if (typeof navigator !== "undefined") {
                      navigator.clipboard.writeText(window.location.href)
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-ds-muted text-ds-foreground rounded-lg hover:bg-ds-muted/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
              </div>
            </div>
          </div>

          <aside className="hidden lg:block space-y-6">
            <div className="sticky top-4 space-y-6">
              {event.ticketTypes && event.ticketTypes.length > 0 && (
                <TicketSelector
                  locale={locale}
                  ticketTypes={event.ticketTypes}
                  selectedTickets={selectedTickets}
                  onSelectionChange={setSelectedTickets}
                />
              )}

              {(event.status === "upcoming" || event.status === "ongoing") && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-ds-foreground mb-3 text-center">
                    {t(locale, "events.date_time")}
                  </h3>
                  <EventCountdown
                    date={event.date || event.start_date}
                    locale={locale}
                    size="sm"
                  />
                </div>
              )}

              {event.venue && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-ds-foreground mb-2">
                    {t(locale, "events.venue")}
                  </h3>
                  <p className="text-sm text-ds-foreground">{event.venue.name}</p>
                  {event.venue.address && (
                    <p className="text-xs text-ds-muted-foreground mt-0.5">{event.venue.address}</p>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EventScheduleBlock eventId={event.id} />
        <ReviewListBlock productId={event.id} />
      </div>
    </div>
  )
}
