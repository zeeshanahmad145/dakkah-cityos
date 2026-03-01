// @ts-nocheck
import { t } from "@/lib/i18n"
import { Link } from "@tanstack/react-router"

export interface EventCardData {
  id: string
  name?: string
  title?: string
  handle?: string
  thumbnail?: string
  image_url?: string
  date?: string
  start_date?: string
  end_date?: string
  endDate?: string
  venue?: string | { name: string; address?: string }
  city?: string
  category?: string
  event_type?: string
  price?: number | { amount: number; currencyCode: string }
  currency?: string
  isFree?: boolean
  rating?: number
  total_reviews?: number
  capacity?: number
  availableTickets?: number
  totalTickets?: number
  status?: "upcoming" | "ongoing" | "ended" | "cancelled" | "sold-out"
  organizer?: string
  tags?: string[]
}

export function EventCard({
  event,
  locale,
  prefix,
}: {
  event: EventCardData
  locale: string
  prefix: string
}) {
  const eventTitle = event.name || event.title || "Untitled Event"
  const eventDateStr = event.start_date || event.date || ""
  const eventDate = eventDateStr ? new Date(eventDateStr) : null
  const isValidDate = eventDate && !isNaN(eventDate.getTime())

  const month = isValidDate
    ? eventDate.toLocaleDateString(
        locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US",
        { month: "short" },
      )
    : ""
  const day = isValidDate ? eventDate.getDate() : ""

  const venueName =
    typeof event.venue === "string" ? event.venue : event.venue?.name || ""
  const locationText = [venueName, event.city].filter(Boolean).join(", ")

  let priceAmount: number | null = null
  let currencyCode = "SAR"
  if (typeof event.price === "number") {
    priceAmount = event.price
    currencyCode = event.currency || "SAR"
  } else if (event.price && typeof event.price === "object") {
    priceAmount = event.price.amount
    currencyCode = event.price.currencyCode || "SAR"
  }

  const isFree = event.isFree || priceAmount === 0
  const category = event.category || event.event_type || ""
  const status = event.status || "upcoming"
  const eventLink = event.handle || event.id

  const statusStyles: Record<string, string> = {
    upcoming: "bg-ds-info/15 text-ds-info",
    ongoing: "bg-ds-success/15 text-ds-success",
    ended: "bg-ds-muted text-ds-muted-foreground",
    cancelled: "bg-ds-destructive/15 text-ds-destructive",
    "sold-out": "bg-ds-warning/15 text-ds-warning",
  }

  const formatPrice = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat(
        locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US",
        {
          style: "currency",
          currency: currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        },
      ).format(amount)
    } catch {
      return `${currency} ${amount}`
    }
  }

  return (
    <div className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:border-ds-ring hover:shadow-lg transition-all duration-300">
      <Link to={`${prefix}/events/${eventLink}` as never} className="block">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-ds-primary/10 to-ds-accent/10 overflow-hidden">
          {event.image_url || event.thumbnail ? (
            <img
              src={event.image_url || event.thumbnail}
              alt={eventTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ds-primary/10 to-ds-accent/15">
              <svg
                className="w-12 h-12 text-ds-primary/40"
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

          {isValidDate && (
            <div className="absolute top-3 start-3 flex flex-col items-center bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md">
              <span className="text-[10px] font-bold text-ds-primary uppercase leading-tight tracking-wider">
                {month}
              </span>
              <span className="text-xl font-bold text-ds-foreground leading-tight">
                {day}
              </span>
            </div>
          )}

          <div className="absolute top-3 end-3 flex flex-col gap-1 items-end">
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                statusStyles[status] || statusStyles.upcoming
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>

          {category && (
            <div className="absolute bottom-3 start-3">
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/90 text-ds-foreground/80 backdrop-blur-sm shadow-sm">
                {category}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 space-y-3">
        <Link to={`${prefix}/events/${eventLink}` as never} className="block">
          <h3 className="font-semibold text-ds-foreground line-clamp-2 group-hover:text-ds-primary transition-colors">
            {eventTitle}
          </h3>
        </Link>

        {locationText && (
          <div className="flex items-center gap-1.5 text-sm text-ds-muted-foreground">
            <svg
              className="w-4 h-4 flex-shrink-0 text-ds-muted-foreground/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="truncate">{locationText}</span>
          </div>
        )}

        {event.rating && (
          <div className="flex items-center gap-1.5 text-sm">
            <div className="flex items-center gap-0.5">
              <svg
                className="w-4 h-4 text-ds-warning fill-ds-warning"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-medium text-ds-foreground/80">
                {event.rating}
              </span>
            </div>
            {event.total_reviews && (
              <span className="text-ds-muted-foreground/70">
                ({event.total_reviews.toLocaleString()})
              </span>
            )}
          </div>
        )}

        <div className="flex items-end justify-between pt-1">
          <div>
            {isFree ? (
              <span className="text-sm font-semibold text-ds-success">
                {t(locale, "events.free_event")}
              </span>
            ) : priceAmount != null ? (
              <div>
                <span className="text-xs text-ds-muted-foreground/70">
                  From
                </span>
                <span className="text-lg font-bold text-ds-foreground ms-1">
                  {formatPrice(priceAmount, currencyCode)}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <Link
          to={`${prefix}/events/${eventLink}` as never}
          className="block w-full text-center px-4 py-2.5 text-sm font-semibold bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors shadow-sm"
        >
          {status === "sold-out"
            ? t(locale, "events.sold_out")
            : t(locale, "events.get_tickets")}
        </Link>
      </div>
    </div>
  )
}
