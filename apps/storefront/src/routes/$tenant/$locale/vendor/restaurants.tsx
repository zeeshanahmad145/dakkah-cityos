// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useMemo } from "react"

interface Restaurant {
  id: string
  name: string
  handle: string
  description?: string
  cuisine_types?: string[]
  address_line1: string
  address_line2?: string
  city: string
  state?: string
  postal_code: string
  country_code: string
  phone?: string
  email?: string
  operating_hours?: Record<string, any>
  is_active?: boolean
  is_accepting_orders?: boolean
  avg_prep_time_minutes?: number
  delivery_radius_km?: number
  min_order_amount?: number
  delivery_fee?: number
  logo_url?: string
  banner_url?: string
  menu_item_count?: number
  reservation_count?: number
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/restaurants")({
  component: VendorRestaurantsRoute,
})

function VendorRestaurantsRoute() {
  const auth = useAuth()

  const vendorId = useMemo(() => {
    const user = auth?.user || auth?.customer
    if (user?.vendor_id) return user.vendor_id
    if (user?.metadata?.vendor_id) return user.metadata.vendor_id
    if (user?.id) return user.id
    return "current-vendor"
  }, [auth])

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-restaurants"],
    queryFn: async () => {
      return sdk.client.fetch<{ items: Restaurant[]; count: number }>(
        "/vendor/restaurants",
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
          {[...Array(2)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Your Restaurants</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-ds-muted-foreground">
          <p className="text-lg mb-2">No restaurants set up yet</p>
          <p className="text-sm">
            Set up your restaurant profile to start accepting orders.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {items.map((restaurant) => (
            <div
              key={restaurant.id}
              className="border rounded-lg overflow-hidden hover:shadow-md transition"
            >
              {restaurant.banner_url && (
                <div className="h-40 bg-ds-border overflow-hidden">
                  <img
                    loading="lazy"
                    src={restaurant.banner_url}
                    alt={`${restaurant.name} banner`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {restaurant.logo_url && (
                      <img
                        loading="lazy"
                        src={restaurant.logo_url}
                        alt={`${restaurant.name} logo`}
                        className="w-14 h-14 rounded-full object-cover border"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold">{restaurant.name}</h2>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            restaurant.is_active
                              ? "bg-ds-success/15 text-ds-success"
                              : "bg-ds-muted text-ds-foreground"
                          }`}
                        >
                          {restaurant.is_active ? "Active" : "Inactive"}
                        </span>
                        {restaurant.is_accepting_orders && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-ds-info/15 text-ds-info">
                            Accepting Orders
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-ds-muted-foreground">
                        {restaurant.address_line1}, {restaurant.city}
                        {restaurant.state ? `, ${restaurant.state}` : ""}{" "}
                        {restaurant.postal_code}
                      </p>
                    </div>
                  </div>
                </div>

                {restaurant.description && (
                  <p className="text-sm text-ds-muted-foreground mb-4">
                    {restaurant.description}
                  </p>
                )}

                {restaurant.cuisine_types &&
                  restaurant.cuisine_types.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {restaurant.cuisine_types.map((cuisine, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-ds-warning/10 text-ds-warning text-xs rounded-full"
                        >
                          {cuisine}
                        </span>
                      ))}
                    </div>
                  )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold">
                      {restaurant.menu_item_count ?? "—"}
                    </p>
                    <p className="text-xs text-ds-muted-foreground">
                      Menu Items
                    </p>
                  </div>
                  <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold">
                      {restaurant.reservation_count ?? "—"}
                    </p>
                    <p className="text-xs text-ds-muted-foreground">
                      Reservations
                    </p>
                  </div>
                  <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold">
                      {restaurant.avg_prep_time_minutes
                        ? `${restaurant.avg_prep_time_minutes}m`
                        : "—"}
                    </p>
                    <p className="text-xs text-ds-muted-foreground">
                      Avg Prep Time
                    </p>
                  </div>
                  <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold">
                      {restaurant.delivery_radius_km
                        ? `${restaurant.delivery_radius_km}km`
                        : "—"}
                    </p>
                    <p className="text-xs text-ds-muted-foreground">
                      Delivery Radius
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-ds-muted-foreground">
                  {restaurant.phone && <span>{restaurant.phone}</span>}
                  {restaurant.email && <span>{restaurant.email}</span>}
                  {restaurant.min_order_amount != null && (
                    <span>
                      Min order: $
                      {(restaurant.min_order_amount / 100).toFixed(2)}
                    </span>
                  )}
                  {restaurant.delivery_fee != null && (
                    <span>
                      Delivery fee: $
                      {(restaurant.delivery_fee / 100).toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <button className="px-4 py-2 bg-ds-primary text-white text-sm rounded-lg hover:bg-ds-primary/90 transition">
                    Update Menu
                  </button>
                  <button className="px-4 py-2 border text-sm rounded-lg hover:bg-ds-muted/50 transition">
                    View Reservations
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
