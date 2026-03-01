// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface MembershipTier {
  id: string
  name: string
  description?: string
  tier_level: number
  min_points?: number
  annual_fee?: number
  currency_code?: string
  benefits?: string[]
  perks?: string[]
  upgrade_threshold?: number
  downgrade_threshold?: number
  color_code?: string
  icon_url?: string
  is_active?: boolean
  member_count?: number
  revenue?: number
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/memberships")({
  component: VendorMembershipsRoute,
})

function VendorMembershipsRoute() {
  const auth = useAuth()

  const vendorId = useMemo(() => {
    const user = auth?.user || auth?.customer
    if (user?.vendor_id) return user.vendor_id
    if (user?.metadata?.vendor_id) return user.metadata.vendor_id
    if (user?.id) return user.id
    return "current-vendor"
  }, [auth])

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-memberships"],
    queryFn: async () => {
      return sdk.client.fetch<{ items: MembershipTier[]; count: number }>(
        "/vendor/memberships",
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-8 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Membership Plans</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Create Plan
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-ds-muted-foreground">
          <p className="text-lg mb-2">No membership plans yet</p>
          <p className="text-sm">
            Create membership tiers to build your community.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((tier) => (
            <div
              key={tier.id}
              className="border rounded-lg p-6 hover:shadow-md transition relative overflow-hidden"
            >
              {tier.color_code && (
                <div
                  className="absolute top-0 start-0 end-0 h-1"
                  style={{ backgroundColor: tier.color_code }}
                />
              )}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{tier.name}</h3>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    tier.is_active !== false
                      ? "bg-ds-success/15 text-ds-success"
                      : "bg-ds-muted text-ds-foreground"
                  }`}
                >
                  {tier.is_active !== false ? "Active" : "Inactive"}
                </span>
              </div>
              {tier.description && (
                <p className="text-sm text-ds-muted-foreground mb-4">
                  {tier.description}
                </p>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ds-muted-foreground">Tier Level</span>
                  <span className="font-medium">{tier.tier_level}</span>
                </div>
                {tier.annual_fee != null && (
                  <div className="flex justify-between">
                    <span className="text-ds-muted-foreground">Annual Fee</span>
                    <span className="font-medium">
                      {tier.currency_code?.toUpperCase() || "USD"}{" "}
                      {(tier.annual_fee / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                {tier.member_count != null && (
                  <div className="flex justify-between">
                    <span className="text-ds-muted-foreground">Members</span>
                    <span className="font-medium">{tier.member_count}</span>
                  </div>
                )}
                {tier.revenue != null && (
                  <div className="flex justify-between">
                    <span className="text-ds-muted-foreground">Revenue</span>
                    <span className="font-medium text-ds-success">
                      {tier.currency_code?.toUpperCase() || "USD"}{" "}
                      {(tier.revenue / 100).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              {tier.benefits && tier.benefits.length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs text-ds-muted-foreground mb-2">
                    Benefits
                  </p>
                  <ul className="space-y-1">
                    {tier.benefits.slice(0, 3).map((b, i) => (
                      <li
                        key={i}
                        className="text-xs text-ds-foreground/80 flex items-center gap-1"
                      >
                        <span className="text-ds-success">✓</span> {b}
                      </li>
                    ))}
                    {tier.benefits.length > 3 && (
                      <li className="text-xs text-ds-muted-foreground/70">
                        +{tier.benefits.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
              <button className="w-full mt-4 text-sm text-ds-primary hover:underline text-center">
                View Members
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
