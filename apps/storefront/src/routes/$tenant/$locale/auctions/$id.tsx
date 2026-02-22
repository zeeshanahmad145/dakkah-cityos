// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { t } from "@/lib/i18n"
import { formatCurrency } from "@/lib/i18n"
import { useAuctionBids } from "@/lib/hooks/use-auctions"
import { AuctionCountdown } from "@/components/auctions/auction-countdown"
import { BidPanel } from "@/components/auctions/bid-panel"
import { BidHistory } from "@/components/auctions/bid-history"
import { ReviewListBlock } from "@/components/blocks/review-list-block"

function normalizePriceField(val: any, currency: string) {
  if (val == null) return null
  if (typeof val === 'object' && val.amount != null) return val
  return { amount: Number(val), currencyCode: currency }
}

function normalizeDetail(item: any) {
  if (!item) return null
  const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {})
  const currency = item.currency || item.currency_code || meta.currency || meta.currency_code || "USD"
  return { ...meta, ...item,
    thumbnail: item.thumbnail || item.photo_url || item.banner_url || item.logo_url || meta.thumbnail || (meta.images && meta.images[0]) || null,
    images: meta.images || [item.photo_url || item.banner_url || item.logo_url].filter(Boolean),
    description: item.description || meta.description || "",
    price: item.price ?? meta.price ?? null,
    currency,
    startingPrice: normalizePriceField(item.startingPrice ?? item.starting_price ?? item.price ?? meta.starting_price, currency),
    currentPrice: normalizePriceField(item.currentPrice ?? item.current_price ?? meta.current_price, currency),
    buyNowPrice: normalizePriceField(item.buyNowPrice ?? item.buy_now_price ?? meta.buy_now_price, currency),
    endsAt: item.endsAt || item.ends_at || item.end_date || meta.ends_at || meta.end_date || null,
    auctionType: item.auctionType || item.auction_type || meta.auction_type || "english",
    totalBids: item.totalBids ?? item.total_bids ?? item.bid_count ?? meta.total_bids ?? 0,
    rating: item.rating ?? item.avg_rating ?? meta.rating ?? null,
    review_count: item.review_count ?? meta.review_count ?? null,
    location: item.location || item.city || item.address || meta.location || null,
  }
}

export const Route = createFileRoute("/$tenant/$locale/auctions/$id")({
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/auctions/${params.id}`, {
        headers: { "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_b52dbbf895687445775c819d8cd5cb935f27231ef3a32ade606b58d9e5798d3a" },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data.booking || data.event || data.auction || data) }
    } catch { return { item: null } }
  },
  component: AuctionDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Auction Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
})

const statusStyles: Record<string, string> = {
  scheduled: "bg-ds-warning/20 text-ds-warning",
  active: "bg-ds-success/20 text-ds-success",
  ended: "bg-ds-muted text-ds-muted-foreground",
  cancelled: "bg-ds-destructive/20 text-ds-destructive",
}

const typeLabels: Record<string, string> = {
  english: "auction.english",
  dutch: "auction.dutch",
  sealed: "auction.sealed",
  reserve: "auction.reserve",
}

function AuctionDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const auction = loaderData?.item
  const { data: bids, isLoading: bidsLoading } = useAuctionBids(id)

  if (!auction) {
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
              {t(locale, "auction.no_auctions")}
            </p>
            <Link
              to={`${prefix}/auctions` as any}
              className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors"
            >
              {t(locale, "auction.browse_auctions")}
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
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">
              {t(locale, "common.home")}
            </Link>
            <span>/</span>
            <Link
              to={`${prefix}/auctions` as any}
              className="hover:text-ds-foreground transition-colors"
            >
              {t(locale, "auction.title")}
            </Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{auction.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {auction.thumbnail ? (
                <img
                  src={auction.thumbnail}
                  alt={auction.title}
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}

              <div className="absolute top-4 start-4 flex gap-2">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    statusStyles[auction.status] || statusStyles.active
                  }`}
                >
                  {t(locale, `auction.${auction.status}`)}
                </span>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-ds-background/80 text-ds-foreground backdrop-blur-sm">
                  {t(locale, typeLabels[auction.auctionType] || "auction.english")}
                </span>
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">
                {auction.title}
              </h1>

              {auction.seller && (
                <p className="mt-2 text-ds-muted-foreground text-sm">
                  {t(locale, "vendor.title")}: {auction.seller.name}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ds-muted-foreground">
                    {t(locale, "auction.starting_price")}:
                  </span>
                  <span className="text-sm font-medium text-ds-foreground">
                    {formatCurrency(
                      auction.startingPrice.amount,
                      auction.startingPrice.currencyCode,
                      locale as any
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ds-muted-foreground">
                    {t(locale, "auction.bids")}:
                  </span>
                  <span className="text-sm font-medium text-ds-foreground">
                    {auction.totalBids}
                  </span>
                </div>
              </div>
            </div>

            {auction.status === "active" && (
              <AuctionCountdown
                endsAt={auction.endsAt}
                status={auction.status}
                locale={locale}
                variant="banner"
                size="md"
              />
            )}

            {auction.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">
                  {t(locale, "product.description")}
                </h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {auction.description}
                </p>
              </div>
            )}

            <div className="block lg:hidden">
              <BidPanel
                locale={locale}
                currentPrice={auction.currentPrice}
                buyNowPrice={auction.buyNowPrice}
                auctionStatus={auction.status}
              />
            </div>

            <BidHistory
              locale={locale}
              bids={bids || []}
              isLoading={bidsLoading}
            />
          </div>

          <aside className="hidden lg:block space-y-6">
            <div className="sticky top-4 space-y-6">
              <BidPanel
                locale={locale}
                currentPrice={auction.currentPrice}
                buyNowPrice={auction.buyNowPrice}
                auctionStatus={auction.status}
              />

              {auction.status === "active" && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-ds-foreground mb-3">
                    {t(locale, "auction.time_remaining")}
                  </h3>
                  <AuctionCountdown
                    endsAt={auction.endsAt}
                    status={auction.status}
                    locale={locale}
                    variant="card"
                    size="md"
                  />
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReviewListBlock productId={auction.id} />
      </div>
    </div>
  )
}
