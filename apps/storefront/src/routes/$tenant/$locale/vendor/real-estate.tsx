// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface PropertyListing {
  id: string
  title: string
  description?: string
  property_type: string
  listing_type: string
  price: number
  currency_code: string
  price_period?: string
  city: string
  state?: string
  country_code: string
  bedrooms?: number
  bathrooms?: number
  area_sqm?: number
  year_built?: number
  status: string
  viewing_count?: number
  offer_count?: number
  images?: string[]
  virtual_tour_url?: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/real-estate")({
  component: VendorRealEstateRoute,
})

function VendorRealEstateRoute() {
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
    queryKey: ["vendor-real-estate", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/real-estate${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: PropertyListing[]; count: number }>(
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
    under_offer: "bg-ds-warning/15 text-ds-warning",
    sold: "bg-ds-primary/15 text-ds-primary",
    rented: "bg-ds-info/15 text-ds-info",
    expired: "bg-ds-destructive/15 text-ds-destructive",
    withdrawn: "bg-ds-muted text-ds-muted-foreground",
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
        <h1 className="text-2xl font-bold">Property Listings</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + List Property
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          "",
          "active",
          "draft",
          "under_offer",
          "sold",
          "rented",
          "expired",
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
            {(s || "All").replace("_", " ")}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-ds-muted-foreground">
          <p className="text-lg mb-2">No property listings yet</p>
          <p className="text-sm">
            List your first property to start receiving offers.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((property) => (
            <div
              key={property.id}
              className="border rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{property.title}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[property.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {property.status.replace("_", " ")}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-ds-muted text-ds-muted-foreground">
                      {property.property_type}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-ds-info/10 text-ds-info">
                      For {property.listing_type}
                    </span>
                  </div>
                  <p className="text-sm text-ds-muted-foreground mb-3">
                    {property.city}
                    {property.state ? `, ${property.state}` : ""} ·{" "}
                    {property.country_code?.toUpperCase()}
                  </p>
                  <div className="flex items-center gap-6 text-sm text-ds-muted-foreground">
                    <span className="font-medium text-ds-foreground text-base">
                      {property.currency_code?.toUpperCase()}{" "}
                      {property.price.toLocaleString()}
                      {property.price_period &&
                        property.price_period !== "total" && (
                          <span className="text-ds-muted-foreground text-sm font-normal">
                            {" "}
                            / {property.price_period}
                          </span>
                        )}
                    </span>
                    {property.bedrooms != null && (
                      <span>{property.bedrooms} bed</span>
                    )}
                    {property.bathrooms != null && (
                      <span>{property.bathrooms} bath</span>
                    )}
                    {property.area_sqm != null && (
                      <span>{property.area_sqm} m²</span>
                    )}
                    {property.year_built && (
                      <span>Built {property.year_built}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-ds-muted-foreground">
                    {property.viewing_count != null && (
                      <span>{property.viewing_count} viewings</span>
                    )}
                    {property.offer_count != null && (
                      <span className="font-medium text-ds-warning">
                        {property.offer_count} offers
                      </span>
                    )}
                    {property.virtual_tour_url && (
                      <span className="text-ds-primary">
                        Virtual tour available
                      </span>
                    )}
                  </div>
                </div>
                <button className="text-sm text-ds-primary hover:underline ms-4">
                  View Offers
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
