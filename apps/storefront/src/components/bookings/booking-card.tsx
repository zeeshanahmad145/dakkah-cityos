import {
  Calendar,
  Clock,
  MapPin,
  XCircle,
  ArrowPath,
} from "@medusajs/icons"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import type { Booking, BookingStatus } from "../../lib/types/bookings"
import { ProviderCard } from "./provider-select"

interface BookingCardProps {
  booking: Booking
  onCancel?: (id: string) => void
  onReschedule?: (id: string) => void
}

export function BookingCard({
  booking,
  onCancel,
  onReschedule,
}: BookingCardProps) {
  const prefix = useTenantPrefix()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const statusConfig: Record<
    BookingStatus,
    { label: string; className: string }
  > = {
    pending: { label: "Pending", className: "badge-warning" },
    confirmed: { label: "Confirmed", className: "badge-success" },
    in_progress: { label: "In Progress", className: "badge-primary" },
    completed: { label: "Completed", className: "badge-neutral" },
    canceled: { label: "Canceled", className: "badge-danger" },
    no_show: { label: "No Show", className: "badge-danger" },
  }

  const status = statusConfig[booking.status]
  const isPast =
    new Date(booking.end_time!) < new Date() || booking.status === "completed"
  const canModify =
    booking.status === "confirmed" || booking.status === "pending"

  return (
    <div className="enterprise-card overflow-hidden">
      <div className="enterprise-card-header flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-ds-foreground">
            {booking.service?.name || "Booking"}
          </h3>
          <p className="text-sm text-ds-muted-foreground">
            Confirmation: {booking.confirmation_code}
          </p>
        </div>
        <span className={status.className}>{status.label}</span>
      </div>

      <div className="enterprise-card-body space-y-4">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-ds-muted-foreground mt-0.5" />
          <div>
            <div className="font-medium text-ds-foreground">
              {formatDate(booking.start_time)}
            </div>
            <div className="text-sm text-ds-muted-foreground">
              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
            </div>
          </div>
        </div>

        {booking.provider && (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-ds-muted" />
            </div>
            <ProviderCard provider={booking.provider} compact />
          </div>
        )}

        {booking.location && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-ds-muted-foreground mt-0.5" />
            <div>
              <div className="text-sm text-ds-muted-foreground">
                {booking.location}
              </div>
            </div>
          </div>
        )}

        {booking.notes && (
          <div className="bg-ds-muted rounded-lg p-3">
            <div className="text-xs font-medium text-ds-muted-foreground mb-1">Notes</div>
            <p className="text-sm text-ds-foreground">{booking.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-ds-border">
          <span className="text-sm text-ds-muted-foreground">Total Paid</span>
          <span className="font-semibold text-ds-foreground">
            {formatPrice(booking.price, booking.currency_code)}
          </span>
        </div>

        {canModify && !isPast && (
          <div className="flex gap-2 pt-2">
            {onReschedule && (
              <button
                onClick={() => onReschedule(booking.id)}
                className="btn-enterprise-secondary flex-1"
              >
                <ArrowPath className="w-4 h-4" />
                Reschedule
              </button>
            )}
            {onCancel && (
              <button
                onClick={() => onCancel(booking.id)}
                className="btn-enterprise-ghost text-ds-destructive hover:bg-ds-destructive flex-1"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function BookingEmptyState() {
  const prefix = useTenantPrefix()

  return (
    <div className="empty-state">
      <div className="w-16 h-16 rounded-full bg-ds-muted flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-ds-muted-foreground" />
      </div>
      <h3 className="empty-state-title">No bookings yet</h3>
      <p className="empty-state-description">
        Book a service to get started with your appointments.
      </p>
      <a
        href={`${prefix}/bookings`}
        className="btn-enterprise-primary mt-6"
      >
        Browse Services
      </a>
    </div>
  )
}
