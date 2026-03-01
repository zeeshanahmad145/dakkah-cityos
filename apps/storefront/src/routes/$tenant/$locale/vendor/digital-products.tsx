// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface DigitalProduct {
  id: string
  product_id: string
  title: string
  file_url: string
  file_type: string
  file_size_bytes?: number
  preview_url?: string
  version?: string
  max_downloads?: number
  download_count?: number
  is_active?: boolean
  revenue?: number
  currency_code?: string
  created_at: string
}

export const Route = createFileRoute(
  "/$tenant/$locale/vendor/digital-products",
)({
  component: VendorDigitalProductsRoute,
})

function VendorDigitalProductsRoute() {
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
    queryKey: ["vendor-digital-products", statusFilter],
    queryFn: async () => {
      const url = `/vendor/digital-products`
      return sdk.client.fetch<{ items: DigitalProduct[]; count: number }>(url, {
        credentials: "include",
      })
    },
  })

  const items = data?.items || []

  const fileTypeIcons: Record<string, string> = {
    pdf: "📄",
    video: "🎬",
    audio: "🎵",
    image: "🖼️",
    archive: "📦",
    ebook: "📚",
    software: "💿",
    other: "📁",
  }

  function formatBytes(bytes?: number) {
    if (!bytes) return "—"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
        <h1 className="text-2xl font-bold">Digital Products</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Upload Product
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-ds-muted-foreground">
          <p className="text-lg mb-2">No digital products yet</p>
          <p className="text-sm">
            Upload your first digital product to start selling.
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
                <div className="flex items-start gap-4 flex-1">
                  <span className="text-2xl">
                    {fileTypeIcons[product.file_type] || "📁"}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold">{product.title}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          product.is_active !== false
                            ? "bg-ds-success/15 text-ds-success"
                            : "bg-ds-muted text-ds-foreground"
                        }`}
                      >
                        {product.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-ds-muted-foreground mt-2">
                      <span className="uppercase">{product.file_type}</span>
                      <span>{formatBytes(product.file_size_bytes)}</span>
                      {product.version && <span>v{product.version}</span>}
                      {product.download_count != null && (
                        <span>{product.download_count} downloads</span>
                      )}
                      {product.max_downloads && (
                        <span className="text-ds-muted-foreground/70">
                          / {product.max_downloads} max
                        </span>
                      )}
                    </div>
                    {product.revenue != null && (
                      <p className="text-sm font-medium text-ds-success mt-2">
                        Revenue: {product.currency_code?.toUpperCase() || "USD"}{" "}
                        {(product.revenue / 100).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                <button className="text-sm text-ds-primary hover:underline ms-4">
                  View Analytics
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
