import { t } from "@/lib/i18n"
import { formatCurrency } from "@/lib/i18n"
import { Link } from "@tanstack/react-router"
import { AuctionCountdown } from "./auction-countdown"

export interface AuctionCardData {
  id: string
  title: string
  thumbnail?: string
  currentPrice: { amount: number; currencyCode: string }
  auctionType: "english" | "dutch" | "sealed" | "reserve"
  status: "scheduled" | "active" | "ended" | "cancelled"
  endsAt: string
  totalBids: number
  isWatching?: boolean
}

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

export function AuctionCard({
  auction, locale,
  prefix,
  onWatch,
}: {
  auction: AuctionCardData
  locale: string
  prefix: string
  onWatch?: (id: string) => void
}) {
  return (
    <div className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:border-ds-ring transition-colors">
      <Link to={`${prefix}/auctions/${auction.id}` as never} className="block">
        <div className="relative aspect-[4/3] bg-ds-muted overflow-hidden">
          {auction.thumbnail ? (
            <img
              src={auction.thumbnail}
              alt={auction.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-ds-muted-foreground/40"
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

          <div className="absolute top-2 start-2 flex flex-col gap-1">
            <span
              className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                statusStyles[auction.status] || statusStyles.active
              }`}
            >
              {t(locale, `auction.${auction.status}`)}
            </span>
            <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-ds-background/80 text-ds-foreground backdrop-blur-sm">
              {t(locale, typeLabels[auction.auctionType] || "auction.english")}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-4 space-y-3">
        <Link to={`${prefix}/auctions/${auction.id}` as never} className="block">
          <h3 className="font-semibold text-ds-foreground line-clamp-2 group-hover:text-ds-primary transition-colors">
            {auction.title}
          </h3>
        </Link>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-ds-muted-foreground">
              {t(locale, "auction.current_bid")}
            </p>
            <p className="text-lg font-bold text-ds-foreground">
              {formatCurrency(
                auction.currentPrice.amount,
                auction.currentPrice.currencyCode, locale as any,
              )}
            </p>
          </div>
          <div className="text-end">
            <p className="text-xs text-ds-muted-foreground">
              {auction.totalBids} {t(locale, "auction.bids")}
            </p>
          </div>
        </div>

        {auction.status === "active" && (
          <AuctionCountdown
            endsAt={auction.endsAt}
            status={auction.status}
            locale={locale}
            size="sm"
          />
        )}

        <div className="flex gap-2 pt-1">
          <Link
            to={`${prefix}/auctions/${auction.id}` as never}
            className="flex-1 text-center px-3 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors"
          >
            {auction.status === "active"
              ? t(locale, "auction.place_bid")
              : t(locale, "blocks.view_details")}
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault()
              onWatch?.(auction.id)
            }}
            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              auction.isWatching
                ? "bg-ds-accent text-ds-accent-foreground border-ds-accent"
                : "bg-ds-background text-ds-muted-foreground border-ds-border hover:border-ds-ring"
            }`}
            aria-label={
              auction.isWatching
                ? t(locale, "auction.watching")
                : t(locale, "auction.watch")
            }
          >
            <svg
              className="w-4 h-4"
              fill={auction.isWatching ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
