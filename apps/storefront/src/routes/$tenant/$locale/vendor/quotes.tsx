// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState } from "react"

interface Quote {
  id: string
  title: string
  description?: string
  customer_id: string
  status: string
  items?: Array<{ description: string; quantity: number; unit_price: number }>
  subtotal: number
  total: number
  currency_code: string
  valid_until?: string
  terms?: string
  notes?: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/quotes")({
  component: VendorQuotesRoute,
})

function VendorQuotesRoute() {
  const auth = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>("")

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-quotes", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/quotes${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: Quote[]; count: number }>(url, { credentials: "include" })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    draft: "bg-ds-muted text-ds-foreground",
    sent: "bg-ds-info/15 text-ds-info",
    accepted: "bg-ds-success/15 text-ds-success",
    rejected: "bg-ds-destructive/15 text-ds-destructive",
    expired: "bg-ds-warning/15 text-ds-warning",
    converted: "bg-ds-primary/15 text-ds-primary",
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en", { style: "currency", currency: currency || "USD" }).format(amount / 100)
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
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quotes</h1>
          <p className="text-muted-foreground mt-1">Create and manage price quotes for customers</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
            <option value="converted">Converted</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-ds-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Quotes</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </div>
        <div className="bg-ds-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Accepted</p>
          <p className="text-2xl font-bold text-ds-success">{items.filter((q) => q.status === "accepted").length}</p>
        </div>
        <div className="bg-ds-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-ds-primary">{items.filter((q) => q.status === "sent").length}</p>
        </div>
        <div className="bg-ds-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Conversion Rate</p>
          <p className="text-2xl font-bold text-ds-primary">
            {items.length > 0 ? Math.round((items.filter((q) => ["accepted", "converted"].includes(q.status)).length / items.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-ds-card rounded-lg border">
          <h3 className="text-lg font-medium mb-2">No quotes yet</h3>
          <p className="text-muted-foreground">Create your first quote for a customer.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((quote) => (
            <div key={quote.id} className="bg-ds-card border rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{quote.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[quote.status] || "bg-ds-muted text-ds-foreground"}`}>
                      {quote.status}
                    </span>
                  </div>
                  {quote.description && <p className="text-sm text-muted-foreground mb-2">{quote.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Created: {new Date(quote.created_at!).toLocaleDateString()}</span>
                    {quote.valid_until && <span>Valid until: {new Date(quote.valid_until!).toLocaleDateString()}</span>}
                    {quote.items && <span>{quote.items.length} line items</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(quote.total || 0, quote.currency_code)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
