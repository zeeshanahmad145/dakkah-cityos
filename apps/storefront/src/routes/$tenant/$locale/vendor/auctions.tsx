// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface Auction {
  id: string
  title: string
  description?: string
  auction_type: string
  starting_price: number
  reserve_price?: number
  buy_now_price?: number
  current_bid?: number
  bid_count?: number
  currency_code: string
  bid_increment: number
  starts_at: string
  ends_at: string
  status: string
  auto_extend?: boolean
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/auctions")({
  component: VendorAuctionsRoute,
})

function VendorAuctionsRoute() {
  const auth = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>("")

  const vendorId = useMemo(() => {
    const user = auth?.user || auth?.customer
    if (user?.vendor_id) return user.vendor_id
    if (user?.metadata?.vendor_id) return user.metadata.vendor_id
    if (user?.id) return user.id
    return "current-vendor"
  }, [auth])

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-auctions", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/auctions${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: Auction[]; count: number }>(url, {
        credentials: "include",
      })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    active: "bg-ds-success/15 text-ds-success",
    scheduled: "bg-ds-info/15 text-ds-info",
    draft: "bg-ds-muted text-ds-foreground",
    ended: "bg-ds-primary/15 text-ds-primary",
    cancelled: "bg-ds-destructive/15 text-ds-destructive",
  }

  function getTimeRemaining(endsAt: string) {
    const diff = new Date(endsAt).getTime() - Date.now()
    if (diff <= 0) return "Ended"
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ${hours % 24}h left`
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m left`
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Auctions</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Create Auction
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "active", "scheduled", "draft", "ended", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-full border transition ${
              statusFilter === s
                ? "bg-ds-primary text-white border-ds-primary"
                : "bg-ds-card hover:bg-ds-muted/50"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-ds-muted-foreground">
          <p className="text-lg mb-2">No auctions yet</p>
          <p className="text-sm">Create your first auction to start selling.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((auction) => (
            <div
              key={auction.id}
              className="border rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{auction.title}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[auction.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {auction.status}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-ds-muted text-ds-muted-foreground">
                      {auction.auction_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-ds-muted-foreground mt-2">
                    <span>
                      Starting: {auction.currency_code?.toUpperCase()}{" "}
                      {(auction.starting_price / 100).toFixed(2)}
                    </span>
                    {auction.current_bid != null && (
                      <span className="font-medium text-ds-success">
                        Current: {auction.currency_code?.toUpperCase()}{" "}
                        {(auction.current_bid / 100).toFixed(2)}
                      </span>
                    )}
                    {auction.bid_count != null && (
                      <span>{auction.bid_count} bids</span>
                    )}
                    <span
                      className={`font-medium ${auction.status === "active" ? "text-ds-warning" : ""}`}
                    >
                      {getTimeRemaining(auction.ends_at)}
                    </span>
                  </div>
                  {auction.reserve_price != null && (
                    <p className="text-xs text-ds-muted-foreground/70 mt-1">
                      Reserve: {auction.currency_code?.toUpperCase()}{" "}
                      {(auction.reserve_price / 100).toFixed(2)}
                    </p>
                  )}
                </div>
                <button className="text-sm text-ds-primary hover:underline ms-4">
                  View Bids
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
