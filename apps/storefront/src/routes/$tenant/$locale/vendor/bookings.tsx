// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface Booking {
  id: string
  booking_number?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  service_product_id?: string
  start_time: string
  end_time: string
  status: string
  attendee_count?: number
  location_type?: string
  currency_code?: string
  total?: number
  payment_status?: string
  customer_notes?: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/bookings")({
  component: VendorBookingsRoute,
})

function VendorBookingsRoute() {
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
    queryKey: ["vendor-bookings", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/bookings${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: Booking[]; count: number }>(url, {
        credentials: "include",
      })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    confirmed: "bg-ds-success/15 text-ds-success",
    pending: "bg-ds-warning/15 text-ds-warning",
    cancelled: "bg-ds-destructive/15 text-ds-destructive",
    completed: "bg-ds-info/15 text-ds-info",
    no_show: "bg-ds-muted text-ds-foreground",
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
        <h1 className="text-2xl font-bold">Bookings</h1>
        <span className="text-sm text-ds-muted-foreground">
          {data?.count || 0} total bookings
        </span>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "pending", "confirmed", "completed", "cancelled"].map((s) => (
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
          <p className="text-lg mb-2">No bookings found</p>
          <p className="text-sm">
            Bookings will appear here when customers book your services.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-sm text-ds-muted-foreground">
                <th className="pb-3 pe-4">Booking</th>
                <th className="pb-3 pe-4">Customer</th>
                <th className="pb-3 pe-4">Date & Time</th>
                <th className="pb-3 pe-4">Status</th>
                <th className="pb-3 pe-4">Total</th>
                <th className="pb-3">Payment</th>
              </tr>
            </thead>
            <tbody>
              {items.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b hover:bg-ds-muted/50 transition"
                >
                  <td className="py-4 pe-4">
                    <span className="font-medium text-sm">
                      {booking.booking_number || booking.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="py-4 pe-4">
                    <div>
                      <p className="text-sm font-medium">
                        {booking.customer_name || "—"}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">
                        {booking.customer_email}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 pe-4">
                    <div className="text-sm">
                      <p>{new Date(booking.start_time!).toLocaleDateString()}</p>
                      <p className="text-xs text-ds-muted-foreground">
                        {new Date(booking.start_time!).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" — "}
                        {new Date(booking.end_time!).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 pe-4">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[booking.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="py-4 pe-4 text-sm">
                    {booking.total != null
                      ? `${booking.currency_code?.toUpperCase() || "USD"} ${(booking.total / 100).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="py-4 text-sm">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        booking.payment_status === "paid"
                          ? "bg-ds-success/15 text-ds-success"
                          : "bg-ds-warning/15 text-ds-warning"
                      }`}
                    >
                      {booking.payment_status || "pending"}
                    </span>
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
