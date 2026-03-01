// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface FitnessClass {
  id: string
  name: string
  description?: string
  type: string
  schedule: string
  capacity: number
  enrolled_count: number
  price: number
  currency_code: string
  status: string
  instructor?: string
  duration_minutes?: number
  location?: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/fitness")({
  component: VendorFitnessRoute,
})

function VendorFitnessRoute() {
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
    queryKey: ["vendor-fitness", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/fitness${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: FitnessClass[]; count: number }>(url, {
        credentials: "include",
      })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    active: "bg-ds-success/15 text-ds-success",
    draft: "bg-ds-muted text-ds-foreground",
    cancelled: "bg-ds-destructive/15 text-ds-destructive",
    full: "bg-ds-primary/15 text-ds-primary",
    scheduled: "bg-ds-info/15 text-ds-info",
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
        <h1 className="text-2xl font-bold">Fitness Classes</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Create Class
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "active", "scheduled", "draft", "full", "cancelled"].map((s) => (
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
          <p className="text-lg mb-2">No fitness classes yet</p>
          <p className="text-sm">
            Create your first class to start booking clients.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((cls) => (
            <div
              key={cls.id}
              className="border rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{cls.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[cls.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {cls.status}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-ds-muted text-ds-muted-foreground">
                      {cls.type}
                    </span>
                  </div>
                  {cls.description && (
                    <p className="text-ds-muted-foreground text-sm mb-3">
                      {cls.description}
                    </p>
                  )}
                  <div className="flex items-center gap-6 text-sm text-ds-muted-foreground">
                    <span>{cls.schedule}</span>
                    <span className="font-medium text-ds-foreground">
                      {cls.enrolled_count} / {cls.capacity} enrolled
                    </span>
                    {cls.instructor && (
                      <span>Instructor: {cls.instructor}</span>
                    )}
                    {cls.duration_minutes && (
                      <span>{cls.duration_minutes} min</span>
                    )}
                    {cls.location && <span>{cls.location}</span>}
                  </div>
                </div>
                <button className="text-sm text-ds-primary hover:underline ms-4">
                  View Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
