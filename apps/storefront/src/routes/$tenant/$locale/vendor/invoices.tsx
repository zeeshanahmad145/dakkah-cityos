// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState } from "react"

interface Invoice {
  id: string
  invoice_number: string
  order_id?: string
  customer_id?: string
  status: string
  subtotal: number
  tax_total: number
  total: number
  currency_code: string
  due_date?: string
  paid_at?: string
  notes?: string
  items?: Array<{ description: string; quantity: number; unit_price: number }>
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/invoices")({
  component: VendorInvoicesRoute,
})

function VendorInvoicesRoute() {
  const auth = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-invoices", statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (search) params.set("search", search)
      const url = `/vendor/invoices${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: Invoice[]; count: number }>(url, { credentials: "include" })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    draft: "bg-ds-muted text-ds-foreground",
    sent: "bg-ds-info/15 text-ds-info",
    paid: "bg-ds-success/15 text-ds-success",
    overdue: "bg-ds-destructive/15 text-ds-destructive",
    cancelled: "bg-ds-destructive/15 text-ds-destructive",
    partially_paid: "bg-ds-warning/15 text-ds-warning",
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en", { style: "currency", currency: currency || "USD" }).format(amount / 100)
  }

  const totalRevenue = items.filter((i) => i.status === "paid").reduce((sum, i) => sum + (i.total || 0), 0)
  const totalOutstanding = items.filter((i) => ["sent", "overdue"].includes(i.status)).reduce((sum, i) => sum + (i.total || 0), 0)

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
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">Track and manage your invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices..." className="border rounded-lg px-3 py-2 text-sm" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-ds-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Invoices</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </div>
        <div className="bg-ds-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold text-ds-success">{items.filter((i) => i.status === "paid").length}</p>
        </div>
        <div className="bg-ds-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Revenue</p>
          <p className="text-2xl font-bold text-ds-success">{formatCurrency(totalRevenue, "USD")}</p>
        </div>
        <div className="bg-ds-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold text-ds-warning">{formatCurrency(totalOutstanding, "USD")}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-ds-card rounded-lg border">
          <h3 className="text-lg font-medium mb-2">No invoices found</h3>
          <p className="text-muted-foreground">Your invoices will appear here once orders are processed.</p>
        </div>
      ) : (
        <div className="bg-ds-card border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Invoice #</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Due Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((invoice) => (
                <tr key={invoice.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm font-medium">{invoice.invoice_number || invoice.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(invoice.created_at!).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.due_date ? new Date(invoice.due_date!).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status] || "bg-ds-muted text-ds-foreground"}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-right">{formatCurrency(invoice.total || 0, invoice.currency_code)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
