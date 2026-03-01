// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface B2BQuote {
  id: string
  title: string
  quote_number?: string
  buyer: string
  buyer_company?: string
  value: number
  currency_code: string
  items_count: number
  delivery_date?: string
  valid_until?: string
  payment_terms?: string
  notes?: string
  status: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/b2b")({
  component: VendorB2BRoute,
})

function VendorB2BRoute() {
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
    queryKey: ["vendor-b2b", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/b2b${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: B2BQuote[]; count: number }>(url, {
        credentials: "include",
      })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    draft: "bg-ds-muted text-ds-foreground",
    sent: "bg-ds-info/15 text-ds-info",
    accepted: "bg-ds-success/15 text-ds-success",
    declined: "bg-ds-destructive/15 text-ds-destructive",
    expired: "bg-ds-warning/15 text-ds-warning",
    converted: "bg-ds-primary/15 text-ds-primary",
    negotiating: "bg-ds-warning/15 text-ds-warning",
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
        <h1 className="text-2xl font-bold">B2B Quotes & Contracts</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Create Quote
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          "",
          "draft",
          "sent",
          "negotiating",
          "accepted",
          "declined",
          "converted",
          "expired",
        ].map((s) => (
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
          <p className="text-lg mb-2">No B2B quotes yet</p>
          <p className="text-sm">
            Create your first quote to start your B2B sales pipeline.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((quote) => (
            <div
              key={quote.id}
              className="border rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{quote.title}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[quote.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {quote.status}
                    </span>
                    {quote.quote_number && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-ds-muted text-ds-muted-foreground">
                        #{quote.quote_number}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 mb-3">
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold truncate">
                        {quote.buyer}
                        {quote.buyer_company ? ` (${quote.buyer_company})` : ""}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">Buyer</p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {quote.currency_code?.toUpperCase()}{" "}
                        {(quote.value / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">Value</p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">{quote.items_count}</p>
                      <p className="text-xs text-ds-muted-foreground">Items</p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold">
                        {quote.delivery_date
                          ? new Date(quote.delivery_date!).toLocaleDateString()
                          : "TBD"}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">
                        Delivery Date
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-ds-muted-foreground">
                    {quote.valid_until && (
                      <span>
                        Valid until{" "}
                        {new Date(quote.valid_until!).toLocaleDateString()}
                      </span>
                    )}
                    {quote.payment_terms && (
                      <span>Terms: {quote.payment_terms}</span>
                    )}
                    <span>
                      Created {new Date(quote.created_at!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button className="text-sm text-ds-primary hover:underline ms-4">
                  View Contracts
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
