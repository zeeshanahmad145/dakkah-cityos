import { Link } from "@tanstack/react-router"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { ChevronRight, Calendar, Clock } from "@medusajs/icons"
import type { Booking } from "@/lib/types/bookings"

interface UpcomingBookingsProps {
  bookings: Booking[]
  isLoading?: boolean
}

const statusColors: Record<string, string> = {
  confirmed: "bg-ds-success text-ds-success",
  pending: "bg-ds-warning text-ds-warning",
  canceled: "bg-ds-destructive text-ds-destructive",
  completed: "bg-ds-info text-ds-info",
}

export function UpcomingBookings({
  bookings,
  isLoading,
}: UpcomingBookingsProps) {
  const prefix = useTenantPrefix()

  if (isLoading) {
    return (
      <div className="bg-ds-background rounded-lg border border-ds-border">
        <div className="p-4 border-b border-ds-border">
          <h2 className="text-lg font-semibold text-ds-foreground">
            Upcoming Bookings
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-ds-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const upcomingBookings =
    bookings?.filter(
      (b) => b.status === "confirmed" && new Date(b.scheduled_at!) > new Date(),
    ) || []

  if (!upcomingBookings.length) {
    return (
      <div className="bg-ds-background rounded-lg border border-ds-border">
        <div className="p-4 border-b border-ds-border">
          <h2 className="text-lg font-semibold text-ds-foreground">
            Upcoming Bookings
          </h2>
        </div>
        <div className="p-8 text-center">
          <Calendar className="h-12 w-12 text-ds-muted-foreground mx-auto mb-4" />
          <p className="text-ds-muted-foreground">No upcoming bookings</p>
          <Link
            to={`${prefix}/bookings` as never}
            className="mt-4 inline-flex items-center text-sm font-medium text-ds-foreground hover:underline"
          >
            Book a service
            <ChevronRight className="h-4 w-4 ms-1" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-ds-background rounded-lg border border-ds-border">
      <div className="p-4 border-b border-ds-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ds-foreground">
          Upcoming Bookings
        </h2>
        <Link
          to={`${prefix}/account/bookings` as never}
          className="text-sm font-medium text-ds-muted-foreground hover:text-ds-foreground"
        >
          View all
        </Link>
      </div>
      <div className="divide-y divide-ds-border">
        {upcomingBookings.slice(0, 3).map((booking) => {
          const scheduledDate = new Date(booking.scheduled_at!)
          return (
            <Link
              key={booking.id}
              to={`${prefix}/account/bookings/${booking.id}` as never}
              className="flex items-center gap-4 p-4 hover:bg-ds-muted transition-colors"
            >
              <div className="flex flex-col items-center justify-center w-14 h-14 bg-ds-muted rounded-lg">
                <span className="text-xs font-medium text-ds-muted-foreground uppercase">
                  {scheduledDate.toLocaleDateString("en-US", {
                    month: "short",
                  })}
                </span>
                <span className="text-xl font-bold text-ds-foreground">
                  {scheduledDate.getDate()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ds-foreground">
                  {booking.service?.name || "Booking"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-ds-muted-foreground" />
                  <span className="text-sm text-ds-muted-foreground">
                    {scheduledDate.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  {booking.provider && (
                    <>
                      <span className="text-ds-muted-foreground">|</span>
                      <span className="text-sm text-ds-muted-foreground">
                        {booking.provider.name}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <span
                className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                  statusColors[booking.status] ||
                  "bg-ds-muted text-ds-foreground"
                }`}
              >
                {booking.status}
              </span>

              <ChevronRight className="h-5 w-5 text-ds-muted-foreground" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
