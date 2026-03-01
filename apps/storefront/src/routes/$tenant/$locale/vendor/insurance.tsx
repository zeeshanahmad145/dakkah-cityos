// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface InsuranceProduct {
  id: string
  name: string
  coverage_type: string
  description?: string
  premium: number
  currency_code: string
  coverage_amount?: number
  deductible?: number
  policies_sold: number
  claims_count: number
  claims_ratio?: number
  term?: string
  status: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/insurance")({
  component: VendorInsuranceRoute,
})

function VendorInsuranceRoute() {
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
    queryKey: ["vendor-insurance", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/insurance${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: InsuranceProduct[]; count: number }>(
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
    discontinued: "bg-ds-primary/15 text-ds-primary",
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
        <h1 className="text-2xl font-bold">Insurance Products</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Create Product
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          "",
          "active",
          "draft",
          "under_review",
          "suspended",
          "discontinued",
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
          <p className="text-lg mb-2">No insurance products yet</p>
          <p className="text-sm">
            Create your first product to start offering coverage.
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
                      {product.coverage_type}
                    </span>
                  </div>
                  {product.description && (
                    <p className="text-ds-muted-foreground text-sm mb-3">
                      {product.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 mb-3">
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {product.currency_code?.toUpperCase()}{" "}
                        {(product.premium / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">
                        Premium
                      </p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {product.policies_sold}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">
                        Policies Sold
                      </p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {product.claims_count}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">Claims</p>
                    </div>
                    {product.coverage_amount !== undefined && (
                      <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">
                          {product.currency_code?.toUpperCase()}{" "}
                          {(product.coverage_amount / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-ds-muted-foreground">
                          Coverage
                        </p>
                      </div>
                    )}
                    {product.deductible !== undefined && (
                      <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">
                          {product.currency_code?.toUpperCase()}{" "}
                          {(product.deductible / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-ds-muted-foreground">
                          Deductible
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-ds-muted-foreground">
                    {product.term && <span>Term: {product.term}</span>}
                    {product.claims_ratio !== undefined && (
                      <span>Claims Ratio: {product.claims_ratio}%</span>
                    )}
                  </div>
                </div>
                <button className="text-sm text-ds-primary hover:underline ms-4">
                  View Claims
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
