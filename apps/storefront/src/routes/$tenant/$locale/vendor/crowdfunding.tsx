// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface CrowdfundingCampaign {
  id: string
  title: string
  description?: string
  goal_amount: number
  raised_amount: number
  currency_code: string
  backer_count: number
  end_date: string
  status: string
  category?: string
  image_url?: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/crowdfunding")({
  component: VendorCrowdfundingRoute,
})

function VendorCrowdfundingRoute() {
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
    queryKey: ["vendor-crowdfunding", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/crowdfunding${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: CrowdfundingCampaign[]; count: number }>(
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
    funded: "bg-ds-primary/15 text-ds-primary",
    ended: "bg-ds-destructive/15 text-ds-destructive",
    pending: "bg-ds-warning/15 text-ds-warning",
  }

  function getProgress(raised: number, goal: number) {
    if (goal <= 0) return 0
    return Math.min(Math.round((raised / goal) * 100), 100)
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
        <h1 className="text-2xl font-bold">Crowdfunding Campaigns</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Launch Campaign
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "active", "draft", "funded", "ended", "pending"].map((s) => (
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
          <p className="text-lg mb-2">No crowdfunding campaigns yet</p>
          <p className="text-sm">
            Launch your first campaign to start raising funds.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((campaign) => {
            const progress = getProgress(
              campaign.raised_amount,
              campaign.goal_amount,
            )
            return (
              <div
                key={campaign.id}
                className="border rounded-lg p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {campaign.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[campaign.status] || "bg-ds-muted text-ds-foreground"}`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    {campaign.description && (
                      <p className="text-ds-muted-foreground text-sm mb-3">
                        {campaign.description}
                      </p>
                    )}
                    <div className="w-full bg-ds-border rounded-full h-2 mb-3">
                      <div
                        className="bg-ds-primary h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-6 text-sm text-ds-muted-foreground">
                      <span className="font-medium text-ds-foreground">
                        {campaign.currency_code?.toUpperCase()}{" "}
                        {(campaign.raised_amount / 100).toFixed(2)}
                        <span className="text-ds-muted-foreground font-normal">
                          {" "}
                          / {(campaign.goal_amount / 100).toFixed(2)}
                        </span>
                      </span>
                      <span className="font-medium text-ds-primary">
                        {progress}%
                      </span>
                      <span>{campaign.backer_count} backers</span>
                      <span>
                        Ends {new Date(campaign.end_date!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button className="text-sm text-ds-primary hover:underline ms-4">
                    View Dashboard
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
