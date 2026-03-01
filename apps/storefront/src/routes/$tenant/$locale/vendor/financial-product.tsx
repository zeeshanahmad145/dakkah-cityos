// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface FinancialProduct {
  id: string
  name: string
  type: string
  description?: string
  interest_rate: number
  term: string
  min_amount?: number
  max_amount?: number
  applications_count: number
  approved_count?: number
  currency_code: string
  risk_level?: string
  status: string
  created_at: string
}

export const Route = createFileRoute(
  "/$tenant/$locale/vendor/financial-product",
)({
  component: VendorFinancialProductRoute,
})

function VendorFinancialProductRoute() {
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
    queryKey: ["vendor-financial-product", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/financial-product${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: FinancialProduct[]; count: number }>(
        url,
        {
          credentials: "include",
        },
      )
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    active: "bg-ds-success/15 text-ds-success",
    draft: "bg-ds-muted text-ds-foreground",
    suspended: "bg-ds-destructive/15 text-ds-destructive",
    under_review: "bg-ds-warning/15 text-ds-warning",
    archived: "bg-ds-primary/15 text-ds-primary",
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
        <h1 className="text-2xl font-bold">Financial Products</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Add Product
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "active", "draft", "under_review", "suspended", "archived"].map(
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
              {s ? s.replace(/_/g, " ") : "All"}
            </button>
          ),
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-ds-muted-foreground">
          <p className="text-lg mb-2">No financial products yet</p>
          <p className="text-sm">
            Add your first product to start accepting applications.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[product.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {product.status.replace(/_/g, " ")}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-ds-muted text-ds-muted-foreground">
                      {product.type}
                    </span>
                  </div>
                  {product.description && (
                    <p className="text-ds-muted-foreground text-sm mb-3">
                      {product.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 mb-3">
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {product.interest_rate}%
                      </p>
                      <p className="text-xs text-ds-muted-foreground">
                        Interest Rate
                      </p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold">{product.term}</p>
                      <p className="text-xs text-ds-muted-foreground">Term</p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {product.applications_count}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">
                        Applications
                      </p>
                    </div>
                    {product.approved_count !== undefined && (
                      <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">
                          {product.approved_count}
                        </p>
                        <p className="text-xs text-ds-muted-foreground">
                          Approved
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-ds-muted-foreground">
                    {product.min_amount !== undefined && (
                      <span>
                        Min: {product.currency_code?.toUpperCase()}{" "}
                        {(product.min_amount / 100).toFixed(2)}
                      </span>
                    )}
                    {product.max_amount !== undefined && (
                      <span>
                        Max: {product.currency_code?.toUpperCase()}{" "}
                        {(product.max_amount / 100).toFixed(2)}
                      </span>
                    )}
                    {product.risk_level && (
                      <span>Risk: {product.risk_level}</span>
                    )}
                  </div>
                </div>
                <button className="text-sm text-ds-primary hover:underline ms-4">
                  View Applications
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
