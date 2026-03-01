import { Link } from "@tanstack/react-router"
import { Booking } from "@/lib/types/bookings"
import { BellAlert, Calendar, Clock, ChevronRight } from "@medusajs/icons"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface BookingReminderProps {
  booking: Booking
}

export function BookingReminder({ booking }: BookingReminderProps) {
  const prefix = useTenantPrefix()
  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (d.toDateString() === now.toDateString()) {
      return "Today"
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    }
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTimeUntil = (date: string) => {
    const now = new Date()
    const target = new Date(date)
    const diff = target.getTime() - now.getTime()

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `in ${days} day${days > 1 ? "s" : ""}`
    } else if (hours > 0) {
      return `in ${hours} hour${hours > 1 ? "s" : ""}`
    } else {
      return "soon"
    }
  }

  const isToday =
    new Date(booking.scheduled_at!).toDateString() === new Date().toDateString()

  return (
    <Link
      to={`${prefix}/account/bookings/${booking.id}` as never}
      className={`block rounded-xl border p-4 transition-all hover:shadow-sm ${
        isToday
          ? "bg-ds-info border-ds-info hover:border-ds-info"
          : "bg-ds-background border-ds-border hover:border-ds-border"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isToday ? "bg-ds-info" : "bg-ds-muted"
          }`}
        >
          <BellAlert
            className={`w-5 h-5 ${isToday ? "text-ds-info" : "text-ds-muted-foreground"}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-ds-foreground truncate">
              {booking.service?.name || "Booking"}
            </h4>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                isToday
                  ? "bg-ds-info text-ds-info"
                  : "bg-ds-muted text-ds-muted-foreground"
              }`}
            >
              {getTimeUntil(booking.scheduled_at)}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm text-ds-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(booking.scheduled_at)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(booking.scheduled_at)}
            </span>
          </div>

          {booking.provider && (
            <p className="text-sm text-ds-muted-foreground mt-1">
              With: {booking.provider.name}
            </p>
          )}
        </div>

        <ChevronRight className="w-5 h-5 text-ds-muted-foreground" />
      </div>
    </Link>
  )
}
