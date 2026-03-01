// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface WishlistProduct {
  id: string
  product_name: string
  product_id: string
  wishlist_count: number
  added_date: string
  thumbnail?: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/wishlists")({
  component: VendorWishlistsRoute,
})

function VendorWishlistsRoute() {
  const auth = useAuth()
  const [sortBy, setSortBy] = useState<string>("most_wishlisted")

  const vendorId = useMemo(() => {
    const user = auth?.user || auth?.customer
    if (user?.vendor_id) return user.vendor_id
    if (user?.metadata?.vendor_id) return user.metadata.vendor_id
    if (user?.id) return user.id
    return "current-vendor"
  }, [auth])

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-wishlists", sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (sortBy) params.set("sort", sortBy)
      const url = `/vendor/wishlists${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: WishlistProduct[]; count: number }>(
        url,
        {
          credentials: "include",
        },
      )
    },
  })

  const items = data?.items || []

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
        <h1 className="text-2xl font-bold">Wishlist Analytics</h1>
        <div className="flex gap-2">
          {["most_wishlisted", "recently_added"].map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 text-sm rounded-full border transition ${
                sortBy === s
                  ? "bg-ds-primary text-white border-ds-primary"
                  : "bg-ds-card hover:bg-ds-muted/50"
              }`}
            >
              {s === "most_wishlisted" ? "Most Wishlisted" : "Recently Added"}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-ds-muted-foreground">
          <p className="text-lg mb-2">No wishlist data yet</p>
          <p className="text-sm">
            Products will appear here when customers add them to wishlists.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-sm text-ds-muted-foreground">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Wishlist Count</th>
                <th className="py-3 px-4">Last Added</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b hover:bg-ds-muted/50 transition"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {item.thumbnail && (
                        <img
                          loading="lazy"
                          src={item.thumbnail}
                          alt={item.product_name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <span className="font-medium">{item.product_name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-ds-destructive">♥</span>
                      <span className="font-semibold">
                        {item.wishlist_count.toLocaleString()}
                      </span>
                    </span>
                  </td>
                  <td className="py-4 px-4 text-ds-muted-foreground text-sm">
                    {new Date(item.added_date!).toLocaleDateString()}
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
