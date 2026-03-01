// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface AdCampaign {
  id: string
  name: string
  description?: string
  type: string
  budget: number
  spend: number
  impressions: number
  clicks: number
  currency_code: string
  status: string
  start_date?: string
  end_date?: string
  target_audience?: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/advertising")({
  component: VendorAdvertisingRoute,
})

function VendorAdvertisingRoute() {
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
    queryKey: ["vendor-advertising", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/advertising${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: AdCampaign[]; count: number }>(url, {
        credentials: "include",
      })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    active: "bg-ds-success/15 text-ds-success",
    paused: "bg-ds-warning/15 text-ds-warning",
    draft: "bg-ds-muted text-ds-foreground",
    ended: "bg-ds-destructive/15 text-ds-destructive",
    scheduled: "bg-ds-info/15 text-ds-info",
  }

  function getCTR(clicks: number, impressions: number) {
    if (impressions <= 0) return "0.00"
    return ((clicks / impressions) * 100).toFixed(2)
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
        <h1 className="text-2xl font-bold">Ad Campaigns</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Create Campaign
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "active", "scheduled", "paused", "draft", "ended"].map((s) => (
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
          <p className="text-lg mb-2">No ad campaigns yet</p>
          <p className="text-sm">
            Create your first campaign to start advertising.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((campaign) => (
            <div
              key={campaign.id}
              className="border rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{campaign.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[campaign.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {campaign.status}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-ds-muted text-ds-muted-foreground">
                      {campaign.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 mb-3">
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {campaign.currency_code?.toUpperCase()}{" "}
                        {(campaign.budget / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">Budget</p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {campaign.currency_code?.toUpperCase()}{" "}
                        {(campaign.spend / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">Spend</p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {campaign.impressions.toLocaleString()}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">
                        Impressions
                      </p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {campaign.clicks.toLocaleString()}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">Clicks</p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {getCTR(campaign.clicks, campaign.impressions)}%
                      </p>
                      <p className="text-xs text-ds-muted-foreground">CTR</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-ds-muted-foreground">
                    {campaign.start_date && (
                      <span>
                        Started{" "}
                        {new Date(campaign.start_date!).toLocaleDateString()}
                      </span>
                    )}
                    {campaign.end_date && (
                      <span>
                        Ends {new Date(campaign.end_date!).toLocaleDateString()}
                      </span>
                    )}
                    {campaign.target_audience && (
                      <span>Audience: {campaign.target_audience}</span>
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
