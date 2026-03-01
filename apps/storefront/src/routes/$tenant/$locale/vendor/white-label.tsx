// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"
import { t } from "@/lib/i18n"

interface WhiteLabelProduct {
  id: string
  name: string
  brand: string
  category: string
  price: number
  orders: number
  currency_code: string
  status: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/white-label")({
  component: VendorWhiteLabelRoute,
})

function VendorWhiteLabelRoute() {
  const { locale } = Route.useParams()
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
    queryKey: ["vendor-white-label", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/white-label${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: WhiteLabelProduct[]; count: number }>(
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
    archived: "bg-ds-destructive/15 text-ds-destructive",
    pending: "bg-ds-warning/15 text-ds-warning",
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
        <h1 className="text-2xl font-bold">White-Label Products</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Add Product
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "active", "draft", "pending", "archived"].map((s) => (
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
          <p className="text-lg mb-2">No white-label products yet</p>
          <p className="text-sm">
            Add products and customize branding to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-sm text-ds-muted-foreground">
                <th className="pb-3 pe-4">Product</th>
                <th className="pb-3 pe-4">Brand</th>
                <th className="pb-3 pe-4">
                  {t(locale, "verticals.category_label")}
                </th>
                <th className="pb-3 pe-4 text-right">Price</th>
                <th className="pb-3 pe-4 text-right">Orders</th>
                <th className="pb-3 pe-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((product) => (
                <tr
                  key={product.id}
                  className="border-b hover:bg-ds-muted/50 transition"
                >
                  <td className="py-4 pe-4 font-medium">{product.name}</td>
                  <td className="py-4 pe-4 text-sm">{product.brand}</td>
                  <td className="py-4 pe-4 text-sm text-ds-muted-foreground">
                    {product.category}
                  </td>
                  <td className="py-4 pe-4 text-right">
                    {product.currency_code?.toUpperCase()}{" "}
                    {(product.price / 100).toFixed(2)}
                  </td>
                  <td className="py-4 pe-4 text-right">{product.orders}</td>
                  <td className="py-4 pe-4">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[product.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <button className="text-sm text-ds-primary hover:underline">
                      Edit Branding
                    </button>
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
