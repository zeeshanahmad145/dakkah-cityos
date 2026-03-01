import { t } from "@/lib/i18n"
import { formatCurrency } from "@/lib/i18n"
import type { BidEntry } from "@/lib/hooks/use-auctions"
import { useState } from "react"

interface BidHistoryProps {
  locale: string
  bids: BidEntry[]
  isLoading?: boolean
  limit?: number
}

export function BidHistory({
  locale,
  bids,
  isLoading,
  limit = 10,
}: BidHistoryProps) {
  const [showAll, setShowAll] = useState(false)
  const displayBids = showAll ? bids : bids.slice(0, limit)

  if (isLoading) {
    return (
      <div className="bg-ds-background border border-ds-border rounded-xl p-6">
        <h3 className="font-semibold text-ds-foreground mb-4">
          {t(locale, "auction.bid_history")}
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-ds-muted animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-24 bg-ds-muted rounded animate-pulse" />
                <div className="h-3 w-16 bg-ds-muted rounded animate-pulse" />
              </div>
              <div className="h-4 w-16 bg-ds-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-ds-background border border-ds-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-ds-foreground">
          {t(locale, "auction.bid_history")}
        </h3>
        <span className="text-xs text-ds-muted-foreground">
          {bids.length} {t(locale, "auction.bids")}
        </span>
      </div>

      {bids.length === 0 ? (
        <div className="text-center py-8">
          <svg
            className="w-10 h-10 text-ds-muted-foreground/40 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-sm text-ds-muted-foreground">
            {t(locale, "auction.no_auctions")}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {displayBids.map((bid, index) => (
              <div
                key={bid.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  index === 0 && bid.isWinning
                    ? "bg-ds-success/10 border border-ds-success/20"
                    : "hover:bg-ds-muted/50"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-ds-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-ds-muted-foreground">
                    {(bid.bidderName || "?")[0].toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ds-foreground truncate">
                      {bid.bidderName || `Bidder ${bid.bidderId.slice(0, 6)}`}
                    </span>
                    {bid.isAutoBid && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-ds-muted text-ds-muted-foreground">
                        {t(locale, "auction.auto_bid")}
                      </span>
                    )}
                    {bid.isWinning && index === 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-ds-success/20 text-ds-success font-medium">
                        Leading
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ds-muted-foreground">
                    {new Date(bid.timestamp!).toLocaleString()}
                  </p>
                </div>

                <span className="text-sm font-semibold text-ds-foreground flex-shrink-0">
                  {formatCurrency(
                    bid.amount.amount,
                    bid.amount.currencyCode, locale as any,
                  )}
                </span>
              </div>
            ))}
          </div>

          {bids.length > limit && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-4 px-3 py-2 text-sm font-medium text-ds-primary hover:text-ds-primary/80 transition-colors"
            >
              {showAll
                ? t(locale, "blocks.show_less")
                : t(locale, "blocks.show_more")}
            </button>
          )}
        </>
      )}
    </div>
  )
}
