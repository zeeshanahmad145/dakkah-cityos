// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState } from "react"

interface EventTicket {
  id: string
  event_id: string
  event_name?: string
  name: string
  description?: string
  price: number
  currency_code: string
  quantity_available: number
  quantity_sold: number
  ticket_type: string
  status: string
  sale_starts_at?: string
  sale_ends_at?: string
  max_per_order?: number
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/event-ticketing")({
  component: VendorEventTicketingRoute,
})

function VendorEventTicketingRoute() {
  const auth = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>("")

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-event-ticketing", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/event-ticketing${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: EventTicket[]; count: number }>(url, { credentials: "include" })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    active: "bg-ds-success/15 text-ds-success",
    draft: "bg-ds-muted text-ds-foreground",
    sold_out: "bg-ds-destructive/15 text-ds-destructive",
    expired: "bg-ds-warning/15 text-ds-warning",
    cancelled: "bg-ds-destructive/15 text-ds-destructive",
  }

  const ticketTypeLabels: Record<string, string> = {
    general: "General Admission",
    vip: "VIP",
    early_bird: "Early Bird",
    group: "Group",
    student: "Student",
    reserved: "Reserved Seating",
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en", { style: "currency", currency: currency || "USD" }).format(amount / 100)
  }

  const totalRevenue = items.reduce((sum, t) => sum + (t.price * t.quantity_sold), 0)
  const totalSold = items.reduce((sum, t) => sum + t.quantity_sold, 0)

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
          <h1 className="text-2xl font-bold">Event Ticketing</h1>
          <p className="text-muted-foreground mt-1">Manage ticket types and track sales for your events</p>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="sold_out">Sold Out</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-ds-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Ticket Types</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </div>
        <div className="bg-ds-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Sold</p>
          <p className="text-2xl font-bold text-ds-success">{totalSold}</p>
        </div>
        <div className="bg-ds-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Revenue</p>
          <p className="text-2xl font-bold text-ds-success">{formatCurrency(totalRevenue, "USD")}</p>
        </div>
        <div className="bg-ds-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-ds-primary">{items.filter((t) => t.status === "active").length}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-ds-card rounded-lg border">
          <h3 className="text-lg font-medium mb-2">No tickets configured</h3>
          <p className="text-muted-foreground">Create ticket types for your events to start selling.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((ticket) => (
            <div key={ticket.id} className="bg-ds-card border rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{ticket.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status] || "bg-ds-muted text-ds-foreground"}`}>
                      {ticket.status?.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs bg-ds-primary/15 text-ds-primary px-2 py-0.5 rounded">
                      {ticketTypeLabels[ticket.ticket_type] || ticket.ticket_type}
                    </span>
                  </div>
                  {ticket.description && <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>}
                  {ticket.event_name && <p className="text-xs text-muted-foreground mb-2">Event: {ticket.event_name}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span>Sold: {ticket.quantity_sold || 0} / {ticket.quantity_available}</span>
                    {ticket.max_per_order && <span>Max per order: {ticket.max_per_order}</span>}
                    {ticket.sale_starts_at && <span>Sale starts: {new Date(ticket.sale_starts_at!).toLocaleDateString()}</span>}
                    {ticket.sale_ends_at && <span>Sale ends: {new Date(ticket.sale_ends_at!).toLocaleDateString()}</span>}
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-ds-muted rounded-full h-2">
                      <div className="bg-ds-success h-2 rounded-full" style={{ width: `${ticket.quantity_available > 0 ? Math.min(((ticket.quantity_sold || 0) / ticket.quantity_available) * 100, 100) : 0}%` }} />
                    </div>
                  </div>
                </div>
                <div className="text-right ms-4">
                  <p className="text-lg font-bold">{formatCurrency((ticket.price ?? 0), ticket.currency_code)}</p>
                  <p className="text-xs text-muted-foreground">per ticket</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
