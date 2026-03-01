// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface GiftCardTemplate {
  id: string
  design_name: string
  description?: string
  denomination: number
  currency_code: string
  sold_count: number
  redeemed_count: number
  status: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/gift-cards")({
  component: VendorGiftCardsRoute,
})

function VendorGiftCardsRoute() {
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
    queryKey: ["vendor-gift-cards", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/gift-cards${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: GiftCardTemplate[]; count: number }>(
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
        <h1 className="text-2xl font-bold">Gift Card Templates</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Create Template
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "active", "draft", "archived"].map((s) => (
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
          <p className="text-lg mb-2">No gift card templates yet</p>
          <p className="text-sm">
            Create gift card templates for customers to purchase.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((card) => (
            <div
              key={card.id}
              className="border rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {card.design_name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[card.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {card.status}
                    </span>
                  </div>
                  {card.description && (
                    <p className="text-ds-muted-foreground text-sm mb-3">
                      {card.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {card.currency_code?.toUpperCase()}{" "}
                        {(card.denomination / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">
                        Denomination
                      </p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {card.sold_count.toLocaleString()}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">Sold</p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {card.redeemed_count.toLocaleString()}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">
                        Redeemed
                      </p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {card.sold_count > 0
                          ? (
                              (card.redeemed_count / card.sold_count) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </p>
                      <p className="text-xs text-ds-muted-foreground">
                        Redemption Rate
                      </p>
                    </div>
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
