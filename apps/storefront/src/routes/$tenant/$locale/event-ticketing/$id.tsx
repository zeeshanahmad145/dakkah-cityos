// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { useToast } from "@/components/ui/toast"
import { ReviewListBlock } from '@/components/blocks/review-list-block'

function getFallbackItems() {
  return [
    { id: "et-1", name: "Summer Music Festival 2026", venue: "Central Park Arena", date: "2026-07-15T19:00:00Z", thumbnail: "/seed-images/events%2F1459749411175-04bf5292ceea.jpg", price: 8999, category: "concerts", description: "A weekend of live music featuring top international artists. Enjoy performances from Grammy-winning artists, emerging talents, and local bands across multiple stages. Food trucks, art installations, and VIP lounges available.", tickets_available: 250, time: "7:00 PM", ticket_types: [{ name: "General Admission", price: 8999 }, { name: "VIP", price: 19999 }, { name: "Backstage Pass", price: 34999 }] },
    { id: "et-2", name: "Champions League Final Screening", venue: "City Sports Complex", date: "2026-05-30T20:00:00Z", thumbnail: "/seed-images/event-ticketing%2F1488646953014-85cb44e25828.jpg", price: 4999, category: "sports", description: "Watch the Champions League final on the big screen with fellow fans. Giant LED screens, surround sound, food and drinks available.", tickets_available: 500, time: "8:00 PM", ticket_types: [{ name: "Standard", price: 4999 }, { name: "Premium Seating", price: 9999 }] },
    { id: "et-3", name: "Shakespeare in the Park", venue: "Riverside Theater", date: "2026-08-10T18:30:00Z", thumbnail: "/seed-images/events%2F1505373877841-8d25f7d46678.jpg", price: 5999, category: "theater", description: "A modern rendition of A Midsummer Night's Dream under the stars. Bring your own blanket and enjoy an enchanting evening of classical theater.", tickets_available: 120, time: "6:30 PM", ticket_types: [{ name: "Lawn Seating", price: 5999 }, { name: "Reserved Seating", price: 8999 }] },
    { id: "et-4", name: "Stand-Up Comedy Night", venue: "The Laugh Factory", date: "2026-04-20T21:00:00Z", thumbnail: "/seed-images/events%2F1514525253161-7a46d19cd819.jpg", price: 3499, category: "comedy", description: "An evening of laughs with top comedians from around the world. Two-drink minimum included with every ticket.", tickets_available: 80, time: "9:00 PM", ticket_types: [{ name: "General", price: 3499 }, { name: "Front Row", price: 6999 }] },
    { id: "et-5", name: "Tech Innovation Summit 2026", venue: "Convention Center Hall A", date: "2026-09-05T09:00:00Z", thumbnail: "/seed-images/events%2F1540575467063-178a50c2df87.jpg", price: 19999, category: "conferences", description: "Three days of keynotes, workshops, and networking with industry leaders in AI, blockchain, and cloud computing.", tickets_available: 1000, time: "9:00 AM", ticket_types: [{ name: "Day Pass", price: 19999 }, { name: "Full Conference", price: 49999 }, { name: "VIP All-Access", price: 79999 }] },
    { id: "et-6", name: "Food & Wine Festival", venue: "Harbor Pavilion", date: "2026-06-22T12:00:00Z", thumbnail: "/seed-images/events%2F1555939594-58d7cb561ad1.jpg", price: 7499, category: "festivals", description: "Sample cuisines from 50+ local restaurants and wineries. Live cooking demos, sommelier sessions, and family-friendly activities.", tickets_available: 350, time: "12:00 PM", ticket_types: [{ name: "Tasting Pass", price: 7499 }, { name: "Premium Tasting", price: 14999 }] },
  ]
}

function normalizeDetail(item: any) {
  if (!item) return null
  const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {})
  return { ...meta, ...item,
    thumbnail: item.thumbnail || item.image_url || item.photo_url || item.banner_url || meta.thumbnail || null,
    description: item.description || meta.description || "",
    price: item.price ?? meta.price ?? null,
    venue: item.venue || meta.venue || null,
    date: item.date || meta.date || null,
    time: item.time || meta.time || null,
  }
}

export const Route = createFileRoute("/$tenant/$locale/event-ticketing/$id")({
  component: EventTicketingDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name || "Event Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/event-ticketing/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) {
        const fallback = getFallbackItems().find((i) => i.id === params.id) || null
        return normalizeDetail(fallback)
      }
      const data = await resp.json()
      return normalizeDetail(data.item || data)
    } catch {
      const fallback = getFallbackItems().find((i) => i.id === params.id) || null
      return normalizeDetail(fallback)
    }
  },
})

function EventTicketingDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [selectedTicketType, setSelectedTicketType] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [buyLoading, setBuyLoading] = useState(false)
  const toast = useToast()
  const baseUrl = getServerBaseUrl()
  const publishableKey = getMedusaPublishableKey()

  const event = Route.useLoaderData()

  const handleBuyTickets = async () => {
    setBuyLoading(true)
    try {
      const ticketTypes = event?.ticket_types || [{ name: "General Admission", price: event?.price || 0 }]
      const resp = await fetch(`${baseUrl}/store/event-ticketing/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": publishableKey },
        credentials: "include",
        body: JSON.stringify({
          event_id: id,
          ticket_type: ticketTypes[selectedTicketType]?.name,
          quantity
        })
      })
      if (resp.ok) toast.success(`${quantity} ticket${quantity > 1 ? "s" : ""} purchased successfully!`)
      else toast.error("Something went wrong. Please try again.")
    } catch { toast.error("Network error. Please try again.") }
    finally { setBuyLoading(false) }
  }

  const formatPrice = (price: number) => {
    const amount = price >= 100 ? price / 100 : price
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    } catch {
      return dateStr
    }
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Event Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This event may have ended or is no longer available.</p>
            <Link to={`${prefix}/event-ticketing` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const ticketTypes = event.ticket_types || [{ name: "General Admission", price: event.price || 0 }]

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <Link to={`${prefix}/event-ticketing` as any} className="hover:text-ds-foreground transition-colors">Event Ticketing</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{event.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {event.thumbnail ? (
                <img loading="lazy" src={event.thumbnail} alt={event.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-ds-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
              )}
              {event.category && (
                <span className="absolute top-4 start-4 px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary text-white capitalize">
                  {event.category}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{event.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-ds-muted-foreground">
                {event.venue && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {event.venue}
                  </span>
                )}
                {event.date && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {formatDate(event.date)}
                  </span>
                )}
                {event.time && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {event.time}
                  </span>
                )}
              </div>
            </div>

            {event.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">About This Event</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <h2 className="font-semibold text-ds-foreground mb-3">Venue Location</h2>
              <div className="aspect-[16/9] bg-ds-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-ds-muted-foreground">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <p className="text-sm font-medium">{event.venue || "Venue"}</p>
                  <p className="text-xs mt-1">Map view coming soon</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-ds-primary">{formatPrice(ticketTypes[selectedTicketType]?.price || event.price || 0)}</p>
                  <p className="text-xs text-ds-muted-foreground mt-1">per ticket</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ds-foreground mb-2">Ticket Type</label>
                  <div className="space-y-2">
                    {ticketTypes.map((tt: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTicketType(idx)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border transition-colors ${selectedTicketType === idx ? "border-ds-primary bg-ds-primary/5 text-ds-primary" : "border-ds-border text-ds-foreground hover:bg-ds-muted"}`}
                      >
                        <span>{tt.name}</span>
                        <span className="font-semibold">{formatPrice(tt.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ds-foreground mb-2">Quantity</label>
                  <div className="flex items-center border border-ds-border rounded-lg">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 text-ds-foreground hover:bg-ds-muted transition-colors rounded-l-lg">-</button>
                    <span className="flex-1 text-center text-sm font-medium text-ds-foreground">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="px-3 py-2 text-ds-foreground hover:bg-ds-muted transition-colors rounded-r-lg">+</button>
                  </div>
                </div>

                <div className="bg-ds-muted/50 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-ds-muted-foreground">Subtotal</span>
                    <span className="font-semibold text-ds-foreground">{formatPrice((ticketTypes[selectedTicketType]?.price || event.price || 0) * quantity)}</span>
                  </div>
                </div>

                <button
                  onClick={handleBuyTickets}
                  disabled={buyLoading}
                  className="w-full py-3 px-4 bg-ds-primary text-white rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {buyLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                  )}
                  {buyLoading ? "Processing..." : "Buy Tickets"}
                </button>
              </div>

              {event.tickets_available != null && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Availability</h3>
                  <div className="text-sm text-ds-muted-foreground">
                    <p className="font-medium text-ds-foreground">{event.tickets_available} tickets remaining</p>
                    <p className="mt-1">Secure your spot before they sell out!</p>
                  </div>
                </div>
              )}

              {event.date && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Event Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ds-muted-foreground">Date</span>
                      <span className="text-ds-foreground font-medium">{formatDate(event.date)}</span>
                    </div>
                    {event.time && (
                      <div className="flex justify-between">
                        <span className="text-ds-muted-foreground">Time</span>
                        <span className="text-ds-foreground font-medium">{event.time}</span>
                      </div>
                    )}
                    {event.venue && (
                      <div className="flex justify-between">
                        <span className="text-ds-muted-foreground">Venue</span>
                        <span className="text-ds-foreground font-medium">{event.venue}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <section className="py-12 bg-ds-card border-t border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-ds-foreground mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFallbackItems().filter((i) => i.id !== id).slice(0, 3).map((item) => (
              <Link
                key={item.id}
                to={`${prefix}/event-ticketing/${item.id}` as any}
                className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-md transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img loading="lazy" src={item.thumbnail} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-ds-foreground group-hover:text-ds-primary transition-colors line-clamp-1">{item.name}</h3>
                  <p className="text-sm text-ds-muted-foreground mt-1">{item.venue}</p>
                  <p className="text-lg font-bold text-ds-primary mt-2">{formatPrice(item.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <ReviewListBlock productId={event.id || id} heading="Reviews" />
    </div>
  )
}
