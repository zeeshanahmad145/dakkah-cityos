import { t } from "@/lib/i18n"
import { formatCurrency } from "@/lib/i18n"
import { useState } from "react"

interface BidPanelProps {
  locale: string
  currentPrice: { amount: number; currencyCode: string }
  bidIncrement?: number
  buyNowPrice?: { amount: number; currencyCode: string }
  auctionStatus: "scheduled" | "active" | "ended" | "cancelled"
  onPlaceBid?: (amount: number) => void
  onBuyNow?: () => void
}

export function BidPanel({
  locale,
  currentPrice,
  bidIncrement = 1,
  buyNowPrice,
  auctionStatus,
  onPlaceBid,
  onBuyNow,
}: BidPanelProps) {
  const minBid = currentPrice.amount + bidIncrement
  const [bidAmount, setBidAmount] = useState(minBid)
  const [isAutoBid, setIsAutoBid] = useState(false)
  const [maxAutoBid, setMaxAutoBid] = useState(minBid * 2)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDisabled = auctionStatus !== "active"

  const handlePlaceBid = async () => {
    if (bidAmount < minBid || isDisabled) return
    setIsSubmitting(true)
    try {
      onPlaceBid?.(bidAmount)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-5">
      <div>
        <p className="text-xs text-ds-muted-foreground mb-1">
          {t(locale, "auction.current_bid")}
        </p>
        <p className="text-2xl font-bold text-ds-foreground">
          {formatCurrency(
            currentPrice.amount,
            currentPrice.currencyCode, locale as any,
          )}
        </p>
      </div>

      {isDisabled ? (
        <div className="text-center py-4">
          <p className="text-ds-muted-foreground text-sm">
            {auctionStatus === "ended"
              ? t(locale, "auction.auction_ended")
              : auctionStatus === "scheduled"
                ? t(locale, "auction.scheduled")
                : t(locale, "common.cancel")}
          </p>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-xs font-medium text-ds-muted-foreground mb-2">
              {t(locale, "auction.place_bid")}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute start-3 top-1/2 -translate-y-1/2 text-ds-muted-foreground text-sm">
                  {currentPrice.currencyCode.toUpperCase()}
                </span>
                <input
                  type="number"
                  min={minBid}
                  step={bidIncrement}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  className="w-full ps-14 pe-3 py-3 text-sm bg-ds-background border border-ds-border rounded-lg text-ds-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                />
              </div>
              <button
                onClick={handlePlaceBid}
                disabled={bidAmount < minBid || isSubmitting}
                className="px-5 py-3 text-sm font-semibold bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting
                  ? t(locale, "common.loading")
                  : t(locale, "auction.place_bid")}
              </button>
            </div>
            <p className="text-xs text-ds-muted-foreground mt-1.5">
              {t(locale, "auction.bid_increment")}:{" "}
              {formatCurrency(bidIncrement, currentPrice.currencyCode, locale as import("@/lib/i18n").SupportedLocale)}
            </p>
          </div>

          <div className="border-t border-ds-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-ds-foreground">
                {t(locale, "auction.auto_bid")}
              </label>
              <button
                onClick={() => setIsAutoBid(!isAutoBid)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAutoBid ? "bg-ds-primary" : "bg-ds-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAutoBid ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {isAutoBid && (
              <div>
                <label className="block text-xs font-medium text-ds-muted-foreground mb-2">
                  {t(locale, "auction.max_bid")}
                </label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-ds-muted-foreground text-sm">
                    {currentPrice.currencyCode.toUpperCase()}
                  </span>
                  <input
                    type="number"
                    min={minBid}
                    value={maxAutoBid}
                    onChange={(e) => setMaxAutoBid(Number(e.target.value))}
                    className="w-full ps-14 pe-3 py-3 text-sm bg-ds-background border border-ds-border rounded-lg text-ds-foreground focus:outline-none focus:ring-2 focus:ring-ds-ring"
                  />
                </div>
              </div>
            )}
          </div>

          {buyNowPrice && (
            <div className="border-t border-ds-border pt-4">
              <button
                onClick={onBuyNow}
                className="w-full px-4 py-3 text-sm font-semibold bg-ds-accent text-ds-accent-foreground rounded-lg hover:bg-ds-accent/90 transition-colors"
              >
                {t(locale, "auction.buy_now")} —{" "}
                {formatCurrency(
                  buyNowPrice.amount,
                  buyNowPrice.currencyCode, locale as any,
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
