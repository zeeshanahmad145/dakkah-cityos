// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

function getFallbackItems() {
  return [
    { id: "et-1", name: "Summer Music Festival 2026", venue: "Central Park Arena", date: "2026-07-15T19:00:00Z", thumbnail: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80", price: 8999, category: "concerts", description: "A weekend of live music featuring top international artists", tickets_available: 250 },
    { id: "et-2", name: "Champions League Final Screening", venue: "City Sports Complex", date: "2026-05-30T20:00:00Z", thumbnail: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&q=80", price: 4999, category: "sports", description: "Watch the Champions League final on the big screen with fellow fans", tickets_available: 500 },
    { id: "et-3", name: "Shakespeare in the Park", venue: "Riverside Theater", date: "2026-08-10T18:30:00Z", thumbnail: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&q=80", price: 5999, category: "theater", description: "A modern rendition of A Midsummer Night's Dream under the stars", tickets_available: 120 },
    { id: "et-4", name: "Stand-Up Comedy Night", venue: "The Laugh Factory", date: "2026-04-20T21:00:00Z", thumbnail: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&q=80", price: 3499, category: "comedy", description: "An evening of laughs with top comedians from around the world", tickets_available: 80 },
    { id: "et-5", name: "Tech Innovation Summit 2026", venue: "Convention Center Hall A", date: "2026-09-05T09:00:00Z", thumbnail: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80", price: 19999, category: "conferences", description: "Three days of keynotes, workshops, and networking with industry leaders", tickets_available: 1000 },
    { id: "et-6", name: "Food & Wine Festival", venue: "Harbor Pavilion", date: "2026-06-22T12:00:00Z", thumbnail: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80", price: 7499, category: "festivals", description: "Sample cuisines from 50+ local restaurants and wineries", tickets_available: 350 },
    { id: "et-7", name: "Jazz Under the Stars", venue: "Rooftop Lounge", date: "2026-05-15T20:00:00Z", thumbnail: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80", price: 6499, category: "concerts", description: "An intimate evening of live jazz performances with city skyline views", tickets_available: 60 },
    { id: "et-8", name: "Marathon City Run 2026", venue: "Downtown Circuit", date: "2026-10-12T06:00:00Z", thumbnail: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=600&q=80", price: 2999, category: "sports", description: "Join thousands of runners in the annual city marathon", tickets_available: 5000 },
  ]
}

export const Route = createFileRoute("/$tenant/$locale/event-ticketing/")({
  component: EventTicketingPage,
  head: () => ({
    meta: [
      { title: "Event Ticketing | Dakkah CityOS" },
      { name: "description", content: "Browse event tickets on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/event-ticketing`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) { const fb = getFallbackItems(); return { items: fb, count: fb.length } }
      const data = await resp.json()
      const raw = data.items || data.events || data.tickets || []
      if (raw.length > 0) return { items: raw, count: data.count || raw.length }
      const fb = getFallbackItems()
      return { items: fb, count: fb.length }
    } catch {
      const fb = getFallbackItems()
      return { items: fb, count: fb.length }
    }
  },
})

const categoryOptions = ["all", "concerts", "sports", "theater", "comedy", "conferences", "festivals"] as const

function EventTicketingPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.venue || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const formatPrice = (price: number) => {
    const amount = price >= 100 ? price / 100 : price
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary to-ds-info text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">Event Ticketing</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Event Ticketing</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Discover and book tickets for concerts, sports, theater, conferences and more
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} events available</span>
            <span>|</span>
            <span>Secure booking</span>
            <span>|</span>
            <span>Instant confirmation</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">Search Events</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, venue..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">Category</label>
                <div className="space-y-1">
                  {categoryOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setCategoryFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${categoryFilter === opt ? "bg-ds-primary text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_categories') : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            {filteredItems.length === 0 ? (
              <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
                <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'verticals.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">Try adjusting your search or category filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => {
                  const ticketsAvailable = item.tickets_available || 0
                  return (
                    <Link
                      key={item.id}
                      to={`${prefix}/event-ticketing/${item.id}` as any}
                      className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-primary/40 transition-all duration-200"
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-ds-primary/10 to-ds-info/10 relative overflow-hidden">
                        {item.thumbnail ? (
                          <img loading="lazy" src={item.thumbnail} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-ds-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                          </div>
                        )}
                        {item.category && (
                          <span className="absolute top-2 start-2 px-2.5 py-1 text-xs font-bold bg-ds-primary text-white rounded-md capitalize">{item.category}</span>
                        )}
                        {ticketsAvailable > 0 && ticketsAvailable <= 20 && (
                          <span className="absolute bottom-2 start-2 px-2 py-1 text-xs font-medium bg-ds-warning text-white rounded-md">Only {ticketsAvailable} left!</span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-ds-foreground group-hover:text-ds-primary transition-colors line-clamp-1">{item.name}</h3>
                        {item.venue && (
                          <p className="text-sm text-ds-muted-foreground mt-1 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {item.venue}
                          </p>
                        )}
                        {item.date && (
                          <p className="text-sm text-ds-muted-foreground mt-1 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {formatDate(item.date)}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-sm text-ds-muted-foreground mt-2 line-clamp-2">{item.description}</p>
                        )}

                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                          <span className="text-xl font-bold text-ds-primary">{formatPrice(item.price || 0)}</span>
                          <span className="px-4 py-1.5 text-xs font-semibold text-white bg-ds-primary rounded-lg group-hover:bg-ds-primary/90 transition-colors">Get Tickets</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      <section className="py-16 bg-ds-card border-t border-ds-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Browse Events</h3>
              <p className="text-sm text-ds-muted-foreground">Explore upcoming events across concerts, sports, theater and more</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Select Tickets</h3>
              <p className="text-sm text-ds-muted-foreground">Choose your seats and ticket type with transparent pricing</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Book & Enjoy</h3>
              <p className="text-sm text-ds-muted-foreground">Complete your booking securely and receive instant confirmation</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
