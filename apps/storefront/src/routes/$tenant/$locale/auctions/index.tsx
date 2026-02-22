// @ts-nocheck
import { t } from "@/lib/i18n"
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/$tenant/$locale/auctions/")({
  component: AuctionsPage,
  head: () => ({
    meta: [
      { title: "Auctions | Dakkah CityOS" },
      { name: "description", content: "Browse and bid on auctions on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/auctions`, {
        headers: {
          "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_b52dbbf895687445775c819d8cd5cb935f27231ef3a32ade606b58d9e5798d3a",
        },
      })
      if (!resp.ok) return { items: [], count: 0 }
      const data = await resp.json()
      const raw = data.items || data.auctions || data.listings || data.products || []
      const items = raw.map((s: any) => {
        const meta = s.metadata || {}
        return {
          id: s.id,
          title: s.title || meta.title || "Untitled Auction",
          description: s.description || meta.description || "",
          thumbnail: meta.thumbnail || meta.images?.[0] || null,
          images: meta.images || [],
          auction_type: s.auction_type || meta.auction_type || null,
          status: s.status || meta.status || null,
          starting_price: s.starting_price || meta.starting_price || null,
          current_price: s.current_price || meta.current_price || null,
          currency_code: s.currency_code || meta.currency_code || "SAR",
          starts_at: s.starts_at || meta.starts_at || null,
          ends_at: s.ends_at || meta.ends_at || null,
          bid_count: s.bid_count || meta.bid_count || s.total_bids || 0,
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const typeOptions = ["all", "english", "dutch", "sealed", "reverse"] as const
const statusOptions = ["all", "active", "upcoming"] as const

function AuctionsPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesType = typeFilter === "all" || item.auction_type === typeFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const formatPrice = (price: any, currency: string) => {
    if (!price) return "—"
    const amount = typeof price === "object" ? (price.amount || 0) / 100 : price >= 100 ? price / 100 : price
    return `${Number(amount).toLocaleString()} ${currency}`
  }

  const getTimeRemaining = (endsAt: string | null) => {
    if (!endsAt) return null
    const now = new Date().getTime()
    const end = new Date(endsAt).getTime()
    const diff = end - now
    if (diff <= 0) return "Ended"
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h ${mins}m left`
    return `${mins}m left`
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary to-ds-destructive text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">Auctions</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'auctions.title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Bid on unique items and discover incredible deals in real-time auctions.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} auctions available</span>
            <span>|</span>
            <span>{t(locale, 'verticals.instant_booking')}</span>
            <span>|</span>
            <span>{t(locale, 'verticals.secure_transactions')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'verticals.search_label')}</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(locale, 'auctions.search_placeholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">Auction Type</label>
                <div className="space-y-1">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setTypeFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${typeFilter === opt ? "bg-ds-primary text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_types') : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">{t(locale, 'verticals.status_label')}</label>
                <div className="space-y-1">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setStatusFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${statusFilter === opt ? "bg-ds-primary text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all" ? t(locale, 'verticals.all_statuses') : opt.charAt(0).toUpperCase() + opt.slice(1)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">{t(locale, 'auctions.no_results')}</h3>
                <p className="text-ds-muted-foreground text-sm">{t(locale, 'verticals.try_adjusting')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => {
                  const timeLeft = getTimeRemaining(item.ends_at)
                  return (
                    <a
                      key={item.id}
                      href={`${prefix}/auctions/${item.id}`}
                      className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-primary/40 transition-all duration-200"
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-ds-primary/10 to-ds-destructive/15 relative overflow-hidden">
                        {item.thumbnail ? (
                          <img loading="lazy" src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-ds-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                        )}
                        {item.auction_type && (
                          <span className="absolute top-2 start-2 px-2 py-1 text-xs font-medium bg-ds-primary text-white rounded-md capitalize">{item.auction_type}</span>
                        )}
                        {item.status && (
                          <span className={`absolute top-2 end-2 px-2 py-1 text-xs font-medium rounded-md ${item.status === "active" ? "bg-ds-success text-white" : item.status === "upcoming" ? "bg-ds-info text-white" : "bg-ds-muted-foreground text-white"}`}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        )}
                        {item.images && item.images.length > 1 && (
                          <div className="absolute bottom-2 end-2 px-2 py-0.5 text-xs font-medium bg-black/50 text-white rounded-md flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {item.images.length}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-ds-foreground group-hover:text-ds-primary transition-colors line-clamp-1">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-ds-muted-foreground mt-1.5 line-clamp-2">{item.description}</p>
                        )}

                        <div className="flex items-center justify-between mt-3 text-sm">
                          <div>
                            <span className="text-xs text-ds-muted-foreground">Current Bid</span>
                            <p className="font-bold text-ds-primary text-lg">
                              {formatPrice(item.current_price || item.starting_price, item.currency_code)}
                            </p>
                          </div>
                          {item.bid_count > 0 && (
                            <div className="text-right">
                              <span className="text-xs text-ds-muted-foreground">Bids</span>
                              <p className="font-semibold text-ds-foreground">{item.bid_count}</p>
                            </div>
                          )}
                        </div>

                        {timeLeft && (
                          <div className="flex items-center gap-1 mt-2 text-xs">
                            <svg className="w-3.5 h-3.5 text-ds-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className={`font-medium ${timeLeft === "Ended" ? "text-ds-destructive" : "text-ds-warning"}`}>{timeLeft}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                          {item.starting_price && item.current_price && (
                            <span className="text-xs text-ds-muted-foreground line-through">
                              Start: {formatPrice(item.starting_price, item.currency_code)}
                            </span>
                          )}
                          <span className="px-3 py-1.5 text-xs font-semibold text-white bg-ds-primary rounded-lg group-hover:bg-ds-primary/90 transition-colors ms-auto">{t(locale, 'auctions.place_bid')}</span>
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      <section className="py-16 bg-ds-card border-t border-ds-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">{t(locale, 'verticals.how_it_works')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Browse Auctions</h3>
              <p className="text-sm text-ds-muted-foreground">Find items you love from active and upcoming auctions across all categories.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Place Your Bid</h3>
              <p className="text-sm text-ds-muted-foreground">Set your maximum bid and let the system bid on your behalf up to your limit.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-ds-foreground mb-2">Win & Pay</h3>
              <p className="text-sm text-ds-muted-foreground">If you win, complete your payment securely and receive your item.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
