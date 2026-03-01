import { Link } from "@tanstack/react-router"
import { Booking } from "@/lib/types/bookings"
import { formatPrice } from "@/lib/utils/price"
import { ChevronRight, Calendar } from "@medusajs/icons"
import { cn } from "@/lib/utils/cn"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface BookingListProps {
  bookings: Booking[]
  emptyMessage?: string
}

export function BookingList({
  bookings,
  emptyMessage = "No bookings found",
}: BookingListProps) {
  const prefix = useTenantPrefix()
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-ds-success text-ds-success"
      case "pending":
        return "bg-ds-warning text-ds-warning"
      case "cancelled":
        return "bg-ds-destructive text-ds-destructive"
      case "completed":
        return "bg-ds-info text-ds-info"
      default:
        return "bg-ds-muted text-ds-foreground"
    }
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-ds-background rounded-xl border border-ds-border p-12 text-center">
        <Calendar className="w-12 h-12 text-ds-muted-foreground mx-auto mb-4" />
        <p className="text-ds-muted-foreground">{emptyMessage}</p>
        <Link
          to={`${prefix}/bookings` as never}
          className="inline-block mt-4 text-sm font-medium text-ds-foreground hover:underline"
        >
          Browse available services
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Link
          key={booking.id}
          to={`${prefix}/account/bookings/${booking.id}` as never}
          className="block bg-ds-background rounded-xl border border-ds-border p-6 hover:border-ds-border hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-ds-foreground">
                {booking.service?.name || "Booking"}
              </h3>
              <p className="text-sm text-ds-muted-foreground mt-0.5">
                {formatDateTime(booking.scheduled_at)}
              </p>
            </div>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium capitalize",
                getStatusColor(booking.status),
              )}
            >
              {booking.status}
            </span>
          </div>

          {booking.provider && (
            <p className="text-sm text-ds-muted-foreground mb-4">
              With: {booking.provider.name}
            </p>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-ds-border">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-ds-muted-foreground">Duration</p>
                <p className="text-sm text-ds-foreground">
                  {booking.service?.duration || 0} min
                </p>
              </div>
              <div>
                <p className="text-xs text-ds-muted-foreground">Price</p>
                <p className="font-semibold text-ds-foreground">
                  {formatPrice(
                    booking.service?.price ?? 0,
                    booking.service?.currency_code || "usd",
                  )}
                </p>
              </div>
            </div>
            <span className="text-sm text-ds-muted-foreground flex items-center gap-1">
              View details
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
