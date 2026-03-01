// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface HealthcareService {
  id: string
  name: string
  description?: string
  service_type: string
  specialty: string
  appointment_count: number
  rating: number
  price: number
  currency_code: string
  status: string
  availability?: string
  location?: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/healthcare")({
  component: VendorHealthcareRoute,
})

function VendorHealthcareRoute() {
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
    queryKey: ["vendor-healthcare", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/healthcare${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: HealthcareService[]; count: number }>(
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
    inactive: "bg-ds-muted text-ds-foreground",
    suspended: "bg-ds-destructive/15 text-ds-destructive",
    pending: "bg-ds-warning/15 text-ds-warning",
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
        <h1 className="text-2xl font-bold">Healthcare Services</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Add Service
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "active", "inactive", "pending", "suspended"].map((s) => (
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
          <p className="text-lg mb-2">No healthcare services yet</p>
          <p className="text-sm">
            Add your first service to start accepting appointments.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((service) => (
            <div
              key={service.id}
              className="border rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{service.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[service.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {service.status}
                    </span>
                  </div>
                  {service.description && (
                    <p className="text-ds-muted-foreground text-sm mb-3">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center gap-6 text-sm text-ds-muted-foreground">
                    <span className="px-2 py-0.5 bg-ds-info/10 text-ds-info text-xs rounded-full">
                      {service.service_type}
                    </span>
                    <span className="px-2 py-0.5 bg-ds-success/10 text-ds-success text-xs rounded-full">
                      {service.specialty}
                    </span>
                    <span>{service.appointment_count} appointments</span>
                    <span className="text-ds-warning">
                      ★ {service.rating.toFixed(1)}
                    </span>
                    {service.location && <span>{service.location}</span>}
                  </div>
                </div>
                <button className="text-sm text-ds-primary hover:underline ms-4">
                  View Appointments
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
