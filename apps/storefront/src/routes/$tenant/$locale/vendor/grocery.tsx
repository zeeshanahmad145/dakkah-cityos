// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface GroceryProduct {
  id: string
  name: string
  description?: string
  category: string
  price: number
  currency_code: string
  stock: number
  freshness_date: string
  status: string
  unit?: string
  weight?: string
  organic?: boolean
  image_url?: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/grocery")({
  component: VendorGroceryRoute,
})

function VendorGroceryRoute() {
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
    queryKey: ["vendor-grocery", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/grocery${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: GroceryProduct[]; count: number }>(url, {
        credentials: "include",
      })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    available: "bg-ds-success/15 text-ds-success",
    out_of_stock: "bg-ds-destructive/15 text-ds-destructive",
    low_stock: "bg-ds-warning/15 text-ds-warning",
    draft: "bg-ds-muted text-ds-foreground",
    expired: "bg-ds-destructive/15 text-ds-destructive",
  }

  function getFreshnessIndicator(date: string) {
    const diff = new Date(date).getTime() - Date.now()
    if (diff <= 0) return { label: "Expired", color: "text-ds-destructive" }
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days <= 3) return { label: `${days}d left`, color: "text-ds-warning" }
    return { label: `${days}d left`, color: "text-ds-success" }
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
        <h1 className="text-2xl font-bold">Grocery Products</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
            + Add Product
          </button>
          <button className="px-4 py-2 border rounded-lg hover:bg-ds-muted/50 transition">
            Manage Inventory
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "available", "low_stock", "out_of_stock", "draft", "expired"].map(
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
              {(s || "All").replace(/_/g, " ")}
            </button>
          ),
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-ds-muted-foreground">
          <p className="text-lg mb-2">No grocery products yet</p>
          <p className="text-sm">Add your first product to start selling.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((product) => {
            const freshness = getFreshnessIndicator(product.freshness_date)
            return (
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
                        {product.category}
                      </span>
                      {product.organic && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-ds-success/10 text-ds-success">
                          Organic
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-ds-muted-foreground">
                      <span className="font-medium text-ds-foreground">
                        {product.currency_code?.toUpperCase()}{" "}
                        {(product.price / 100).toFixed(2)}
                        {product.unit && (
                          <span className="text-ds-muted-foreground font-normal">
                            {" "}
                            / {product.unit}
                          </span>
                        )}
                      </span>
                      <span>Stock: {product.stock}</span>
                      <span className={freshness.color}>
                        Freshness: {freshness.label}
                      </span>
                      {product.weight && <span>{product.weight}</span>}
                    </div>
                  </div>
                  <button className="text-sm text-ds-primary hover:underline ms-4">
                    Edit
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
