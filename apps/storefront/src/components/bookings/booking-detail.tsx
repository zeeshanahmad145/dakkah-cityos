import { Booking } from "@/lib/types/bookings"
import { formatPrice } from "@/lib/utils/price"
import { cn } from "@/lib/utils/cn"
import { Calendar, Clock, User, MapPin } from "@medusajs/icons"

interface BookingDetailProps {
  booking: Booking
}

export function BookingDetail({ booking }: BookingDetailProps) {
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="bg-ds-background rounded-xl border border-ds-border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-ds-border">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ds-foreground">{booking.service?.name || "Booking"}</h2>
            <p className="text-ds-muted-foreground mt-1">{booking.service?.description}</p>
          </div>
          <span className={cn(
            "px-3 py-1 rounded-full text-sm font-medium capitalize",
            getStatusColor(booking.status)
          )}>
            {booking.status}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-6 space-y-6">
        {/* Confirmation Code */}
        {booking.confirmation_code && (
          <div className="bg-ds-muted rounded-lg p-4">
            <p className="text-xs text-ds-muted-foreground uppercase tracking-wider">Confirmation Code</p>
            <p className="text-lg font-mono font-semibold text-ds-foreground mt-1">
              {booking.confirmation_code}
            </p>
          </div>
        )}

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-ds-muted flex items-center justify-center">
              <Calendar className="w-5 h-5 text-ds-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-ds-muted-foreground uppercase tracking-wider">Date</p>
              <p className="text-sm text-ds-foreground mt-1">{formatDate(booking.scheduled_at)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-ds-muted flex items-center justify-center">
              <Clock className="w-5 h-5 text-ds-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-ds-muted-foreground uppercase tracking-wider">Time</p>
              <p className="text-sm text-ds-foreground mt-1">{formatTime(booking.scheduled_at)}</p>
            </div>
          </div>
        </div>

        {/* Provider */}
        {booking.provider && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-ds-muted flex items-center justify-center">
              <User className="w-5 h-5 text-ds-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-ds-muted-foreground uppercase tracking-wider">Provider</p>
              <p className="text-sm text-ds-foreground mt-1">{booking.provider.name}</p>
            </div>
          </div>
        )}

        {/* Location */}
        {booking.location && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-ds-muted flex items-center justify-center">
              <MapPin className="w-5 h-5 text-ds-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-ds-muted-foreground uppercase tracking-wider">Location</p>
              <p className="text-sm text-ds-foreground mt-1">{booking.location}</p>
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="pt-4 border-t border-ds-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ds-muted-foreground">Duration</p>
              <p className="text-ds-foreground">{booking.service?.duration || 0} minutes</p>
            </div>
            <div className="text-end">
              <p className="text-sm text-ds-muted-foreground">Total</p>
              <p className="text-xl font-semibold text-ds-foreground">
                {formatPrice(booking.service?.price ?? 0, booking.service?.currency_code || "usd")}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="pt-4 border-t border-ds-border">
            <p className="text-xs text-ds-muted-foreground uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-ds-muted-foreground">{booking.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
