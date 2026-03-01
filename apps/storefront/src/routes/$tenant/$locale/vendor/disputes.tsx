// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface Dispute {
  id: string
  order_id: string
  customer_id: string
  reason: string
  description: string
  status: string
  vendor_response?: string
  proposed_resolution?: string
  proposed_amount?: number
  resolution?: string
  created_at: string
  updated_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/disputes")({
  component: VendorDisputesRoute,
})

function VendorDisputesRoute() {
  const auth = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [response, setResponse] = useState("")

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vendor-disputes", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/disputes${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: Dispute[]; count: number }>(url, { credentials: "include" })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    pending: "bg-ds-warning/15 text-ds-warning",
    vendor_responded: "bg-ds-info/15 text-ds-info",
    escalated: "bg-ds-destructive/15 text-ds-destructive",
    resolved: "bg-ds-success/15 text-ds-success",
    closed: "bg-ds-muted text-ds-foreground",
  }

  const reasonLabels: Record<string, string> = {
    product_not_received: "Product Not Received",
    product_damaged: "Product Damaged",
    wrong_item: "Wrong Item",
    quality_issue: "Quality Issue",
    refund_request: "Refund Request",
    other: "Other",
  }

  const handleRespond = async () => {
    if (!selectedDispute || !response.trim()) return
    try {
      await sdk.client.fetch("/vendor/disputes?id=" + selectedDispute.id, {
        method: "POST",
        body: { vendor_response: response, status: "vendor_responded" },
        credentials: "include",
      })
      setSelectedDispute(null)
      setResponse("")
      refetch()
    } catch (e) { console.error("Failed to submit dispute response:", e) }
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
          <h1 className="text-2xl font-bold">Disputes</h1>
          <p className="text-muted-foreground mt-1">Manage customer disputes and resolutions</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="vendor_responded">Responded</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-ds-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Disputes</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </div>
        <div className="bg-ds-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-ds-warning">{items.filter((d) => d.status === "pending").length}</p>
        </div>
        <div className="bg-ds-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Escalated</p>
          <p className="text-2xl font-bold text-ds-destructive">{items.filter((d) => d.status === "escalated").length}</p>
        </div>
        <div className="bg-ds-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Resolved</p>
          <p className="text-2xl font-bold text-ds-success">{items.filter((d) => d.status === "resolved").length}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-ds-card rounded-lg border">
          <h3 className="text-lg font-medium mb-2">No disputes found</h3>
          <p className="text-muted-foreground">You don't have any disputes matching this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((dispute) => (
            <div key={dispute.id} className="bg-ds-card border rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[dispute.status] || "bg-ds-muted text-ds-foreground"}`}>
                      {dispute.status?.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {reasonLabels[dispute.reason] || dispute.reason}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Order: {dispute.order_id?.slice(0, 8)}...
                    </span>
                  </div>
                  <p className="text-sm mb-2">{dispute.description}</p>
                  {dispute.vendor_response && (
                    <div className="bg-ds-info/10 rounded p-3 mt-2">
                      <p className="text-xs font-medium text-ds-info mb-1">Your Response:</p>
                      <p className="text-sm text-ds-info">{dispute.vendor_response}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Opened: {new Date(dispute.created_at!).toLocaleDateString()}
                  </p>
                </div>
                {dispute.status === "pending" && (
                  <button onClick={() => setSelectedDispute(dispute)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
                    Respond
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-ds-card rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Respond to Dispute</h3>
            <p className="text-sm text-muted-foreground mb-4">{selectedDispute.description}</p>
            <textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Your response to this dispute..." className="w-full border rounded-lg p-3 text-sm min-h-[120px] mb-4" />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setSelectedDispute(null); setResponse("") }} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={handleRespond} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Submit Response</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
