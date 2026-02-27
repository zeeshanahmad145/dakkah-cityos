import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { getMedusaPublishableKey } from "@/lib/utils/env"
import { AccountLayout } from "@/components/account"
import { useBooking, useCancelBooking } from "@/lib/hooks/use-bookings"
import { formatPrice } from "@/lib/utils/price"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Spinner, Calendar, Clock, User, MapPin, XMark } from "@medusajs/icons"
import { useState } from "react"

export const Route = createFileRoute("/$tenant/$locale/account/bookings/$id")({
  loader: async ({ params }) => {
    try {
      const { getServerBaseUrl, fetchWithTimeout } = await import("@/lib/utils/env")
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/bookings/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: data.item || data.booking || data }
    } catch { return { item: null } }
  },
  component: BookingDetailPage,
})

const statusColors: Record<string, string> = {
  confirmed: "bg-ds-success text-ds-success",
  pending: "bg-ds-warning text-ds-warning",
  canceled: "bg-ds-destructive text-ds-destructive",
  completed: "bg-ds-info text-ds-info",
}

function BookingDetailPage() {
  const { tenant, locale, id } = Route.useParams() as { tenant: string; locale: string; id: string }
  const { data: booking, isLoading, refetch } = useBooking(id)
  const cancelMutation = useCancelBooking()
  const navigate = useNavigate()
  const baseHref = `/${tenant}/${locale}`
  
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const handleCancel = async () => {
    setCancelLoading(true)
    try {
      await cancelMutation.mutateAsync({ bookingId: id })
      refetch()
      setShowCancelConfirm(false)
    } finally {
      setCancelLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AccountLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner className="w-8 h-8 animate-spin text-ds-muted-foreground" />
        </div>
      </AccountLayout>
    )
  }

  if (!booking) {
    return (
      <AccountLayout>
        <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
          <p className="text-ds-muted-foreground mb-4">Booking not found</p>
          <Link
            to={`${baseHref}/account/bookings` as any}
            className="text-sm font-medium text-ds-foreground hover:underline"
          >
            Back to bookings
          </Link>
        </div>
      </AccountLayout>
    )
  }

  const scheduledDate = new Date(booking.scheduled_at)
  const isPast = scheduledDate < new Date()
  const canCancel = !isPast && booking.status !== "canceled" && booking.status !== "completed"

  return (
    <AccountLayout>
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          to={`${baseHref}/account/bookings` as any}
          className="inline-flex items-center text-sm text-ds-muted-foreground hover:text-ds-foreground"
        >
          <ArrowLeft className="h-4 w-4 me-2" />
          Back to bookings
        </Link>

        {/* Header */}
        <div className="bg-ds-background rounded-lg border border-ds-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-ds-foreground">{booking.service?.name || "Booking"}</h1>
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                    statusColors[booking.status] || "bg-ds-muted text-ds-foreground"
                  }`}
                >
                  {booking.status}
                </span>
              </div>
              <p className="text-ds-muted-foreground mt-1">{booking.service?.description}</p>
            </div>
            <div className="text-end">
              <p className="text-2xl font-bold text-ds-foreground">
                {formatPrice(booking.service?.price ?? 0, booking.service?.currency_code || "usd")}
              </p>
              <p className="text-sm text-ds-muted-foreground">{booking.service?.duration || 0} minutes</p>
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="bg-ds-background rounded-lg border border-ds-border p-6">
          <h2 className="text-lg font-semibold text-ds-foreground mb-4">Appointment Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-ds-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-ds-muted-foreground">Date</p>
                <p className="font-medium text-ds-foreground">
                  {scheduledDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-ds-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-ds-muted-foreground">Time</p>
                <p className="font-medium text-ds-foreground">
                  {scheduledDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            {booking.provider && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-ds-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-ds-muted-foreground">Provider</p>
                  <p className="font-medium text-ds-foreground">{booking.provider.name}</p>
                  {booking.provider.bio && (
                    <p className="text-sm text-ds-muted-foreground">{booking.provider.bio}</p>
                  )}
                </div>
              </div>
            )}
            {booking.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-ds-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-ds-muted-foreground">Location</p>
                  <p className="font-medium text-ds-foreground">{booking.location}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Code */}
        {booking.confirmation_code && (
          <div className="bg-ds-muted rounded-lg border border-ds-border p-6 text-center">
            <p className="text-sm text-ds-muted-foreground mb-2">Confirmation Code</p>
            <p className="text-2xl font-mono font-bold text-ds-foreground tracking-wider">
              {booking.confirmation_code}
            </p>
          </div>
        )}

        {/* Notes */}
        {booking.notes && (
          <div className="bg-ds-background rounded-lg border border-ds-border p-6">
            <h2 className="text-lg font-semibold text-ds-foreground mb-2">Notes</h2>
            <p className="text-ds-muted-foreground">{booking.notes}</p>
          </div>
        )}

        {/* Actions */}
        {canCancel && (
          <div className="bg-ds-background rounded-lg border border-ds-border p-6">
            <h2 className="text-lg font-semibold text-ds-foreground mb-4">Manage Booking</h2>
            
            {!showCancelConfirm ? (
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="fit"
                  onClick={() => navigate({ to: `${baseHref}/bookings/${booking.service?.handle}` as any })}
                >
                  <Calendar className="h-4 w-4 me-2" />
                  Reschedule
                </Button>
                <Button variant="danger" size="fit" onClick={() => setShowCancelConfirm(true)}>
                  <XMark className="h-4 w-4 me-2" />
                  Cancel booking
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-ds-destructive rounded-lg">
                  <p className="text-sm font-medium text-ds-destructive">
                    Are you sure you want to cancel this booking?
                  </p>
                  <p className="text-sm text-ds-destructive mt-1">
                    This action cannot be undone. You may be subject to cancellation fees.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="fit" onClick={() => setShowCancelConfirm(false)}>
                    Keep booking
                  </Button>
                  <Button
                    variant="danger"
                    size="fit"
                    onClick={handleCancel}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? <Spinner className="animate-spin h-4 w-4 me-2" /> : null}
                    Yes, cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AccountLayout>
  )
}
