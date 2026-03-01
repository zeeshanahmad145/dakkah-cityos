// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface SocialPost {
  id: string
  title: string
  platform: string
  content?: string
  likes: number
  shares: number
  comments: number
  sales: number
  revenue?: number
  currency_code: string
  media_type?: string
  published_at?: string
  status: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/social-commerce")(
  {
    component: VendorSocialCommerceRoute,
  },
)

function VendorSocialCommerceRoute() {
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
    queryKey: ["vendor-social-commerce", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/social-commerce${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: SocialPost[]; count: number }>(url, {
        credentials: "include",
      })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    published: "bg-ds-success/15 text-ds-success",
    draft: "bg-ds-muted text-ds-foreground",
    scheduled: "bg-ds-info/15 text-ds-info",
    archived: "bg-ds-destructive/15 text-ds-destructive",
    pending: "bg-ds-warning/15 text-ds-warning",
  }

  function getEngagementRate(likes: number, shares: number, comments: number) {
    const total = likes + shares + comments
    return total.toLocaleString()
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
        <h1 className="text-2xl font-bold">Social Commerce</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Create Post
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "published", "scheduled", "draft", "pending", "archived"].map(
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
              {s || "All"}
            </button>
          ),
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-ds-muted-foreground">
          <p className="text-lg mb-2">No social posts yet</p>
          <p className="text-sm">
            Create your first post to start selling on social platforms.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((post) => (
            <div
              key={post.id}
              className="border rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[post.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {post.status}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-ds-muted text-ds-muted-foreground">
                      {post.platform}
                    </span>
                    {post.media_type && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-ds-muted text-ds-muted-foreground">
                        {post.media_type}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 mb-3">
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {post.likes.toLocaleString()}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">Likes</p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {post.shares.toLocaleString()}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">Shares</p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {post.comments.toLocaleString()}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">
                        Comments
                      </p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">{post.sales}</p>
                      <p className="text-xs text-ds-muted-foreground">Sales</p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {getEngagementRate(
                          post.likes,
                          post.shares,
                          post.comments,
                        )}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">
                        Engagement
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-ds-muted-foreground">
                    {post.published_at && (
                      <span>
                        Published{" "}
                        {new Date(post.published_at!).toLocaleDateString()}
                      </span>
                    )}
                    {post.revenue !== undefined && (
                      <span>
                        Revenue: {post.currency_code?.toUpperCase()}{" "}
                        {(post.revenue / 100).toFixed(2)}
                      </span>
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
