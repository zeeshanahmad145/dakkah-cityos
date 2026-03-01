// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface Transaction {
  id: string
  type: string
  amount: number
  currency_code: string
  status: string
  reference: string
  description?: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/transactions")({
  component: VendorTransactionsRoute,
})

function VendorTransactionsRoute() {
  const auth = useAuth()
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")

  const vendorId = useMemo(() => {
    const user = auth?.user || auth?.customer
    if (user?.vendor_id) return user.vendor_id
    if (user?.metadata?.vendor_id) return user.metadata.vendor_id
    if (user?.id) return user.id
    return "current-vendor"
  }, [auth])

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-transactions", typeFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (typeFilter) params.set("type", typeFilter)
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/transactions${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: Transaction[]; count: number }>(url, {
        credentials: "include",
      })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    completed: "bg-ds-success/15 text-ds-success",
    pending: "bg-ds-warning/15 text-ds-warning",
    processing: "bg-ds-info/15 text-ds-info",
    failed: "bg-ds-destructive/15 text-ds-destructive",
    refunded: "bg-ds-muted text-ds-foreground",
  }

  const typeColors: Record<string, string> = {
    sale: "bg-ds-success/10 text-ds-success",
    refund: "bg-ds-destructive/10 text-ds-destructive",
    payout: "bg-ds-info/10 text-ds-info",
    fee: "bg-ds-warning/10 text-ds-warning",
    adjustment: "bg-ds-primary/10 text-ds-primary",
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
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
        <h1 className="text-2xl font-bold">Transactions</h1>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex gap-2 items-center">
          <span className="text-sm text-ds-muted-foreground">Type:</span>
          {["", "sale", "refund", "payout", "fee", "adjustment"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-sm rounded-full border transition ${
                typeFilter === t
                  ? "bg-ds-primary text-white border-ds-primary"
                  : "bg-ds-card hover:bg-ds-muted/50"
              }`}
            >
              {t || "All"}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-ds-muted-foreground">Status:</span>
          {["", "completed", "pending", "processing", "failed", "refunded"].map(
            (s) => (
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
            ),
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-ds-muted-foreground">
          <p className="text-lg mb-2">No transactions yet</p>
          <p className="text-sm">
            Your transaction history will appear here once you start receiving
            orders.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-sm text-ds-muted-foreground">
                <th className="pb-3 pe-4">Date</th>
                <th className="pb-3 pe-4">Type</th>
                <th className="pb-3 pe-4">Reference</th>
                <th className="pb-3 pe-4">Description</th>
                <th className="pb-3 pe-4 text-right">Amount</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((txn) => (
                <tr
                  key={txn.id}
                  className="border-b hover:bg-ds-muted/50 transition"
                >
                  <td className="py-4 pe-4 text-sm text-ds-muted-foreground">
                    {new Date(txn.created_at!).toLocaleDateString()}
                  </td>
                  <td className="py-4 pe-4">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${typeColors[txn.type] || "bg-ds-muted/50 text-ds-foreground/80"}`}
                    >
                      {txn.type?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-4 pe-4 text-sm font-mono text-ds-muted-foreground">
                    {txn.reference || "—"}
                  </td>
                  <td className="py-4 pe-4 text-sm text-ds-muted-foreground">
                    {txn.description || "—"}
                  </td>
                  <td className="py-4 pe-4 text-right font-medium">
                    <span
                      className={
                        txn.type === "refund" || txn.type === "fee"
                          ? "text-ds-destructive"
                          : "text-ds-success"
                      }
                    >
                      {txn.type === "refund" || txn.type === "fee" ? "−" : "+"}
                      {txn.currency_code?.toUpperCase()}{" "}
                      {(Math.abs(txn.amount) / 100).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[txn.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {txn.status?.replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
