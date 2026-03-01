// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface LegalCase {
  id: string
  title: string
  case_number?: string
  type: string
  client: string
  status: string
  billing_hours: number
  hourly_rate?: number
  amount: number
  currency_code: string
  priority?: string
  assigned_to?: string
  opened_date: string
  closed_date?: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/legal")({
  component: VendorLegalRoute,
})

function VendorLegalRoute() {
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
    queryKey: ["vendor-legal", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/legal${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: LegalCase[]; count: number }>(url, {
        credentials: "include",
      })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    open: "bg-ds-success/15 text-ds-success",
    in_progress: "bg-ds-info/15 text-ds-info",
    pending: "bg-ds-warning/15 text-ds-warning",
    closed: "bg-ds-muted text-ds-foreground",
    on_hold: "bg-ds-warning/15 text-ds-warning",
    resolved: "bg-ds-primary/15 text-ds-primary",
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
        <h1 className="text-2xl font-bold">Legal Cases</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + New Case
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          "",
          "open",
          "in_progress",
          "pending",
          "on_hold",
          "resolved",
          "closed",
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
            {s ? s.replace(/_/g, " ") : "All"}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-ds-muted-foreground">
          <p className="text-lg mb-2">No legal cases yet</p>
          <p className="text-sm">
            Create your first case to start managing legal matters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((legalCase) => (
            <div
              key={legalCase.id}
              className="border rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{legalCase.title}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[legalCase.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {legalCase.status.replace(/_/g, " ")}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-ds-muted text-ds-muted-foreground">
                      {legalCase.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 mb-3">
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold truncate">
                        {legalCase.client}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">Client</p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {legalCase.billing_hours}h
                      </p>
                      <p className="text-xs text-ds-muted-foreground">
                        Billing Hours
                      </p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {legalCase.currency_code?.toUpperCase()}{" "}
                        {(legalCase.amount / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">Amount</p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold">
                        {new Date(legalCase.opened_date!).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">Opened</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-ds-muted-foreground">
                    {legalCase.case_number && (
                      <span>Case #{legalCase.case_number}</span>
                    )}
                    {legalCase.priority && (
                      <span>Priority: {legalCase.priority}</span>
                    )}
                    {legalCase.assigned_to && (
                      <span>Assigned: {legalCase.assigned_to}</span>
                    )}
                  </div>
                </div>
                <button className="text-sm text-ds-primary hover:underline ms-4">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
