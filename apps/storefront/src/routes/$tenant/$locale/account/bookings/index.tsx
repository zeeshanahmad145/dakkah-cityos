import { createFileRoute, Link } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { useCustomerBookings } from "@/lib/hooks/use-bookings"
import { formatPrice } from "@/lib/utils/price"
import { Calendar, ChevronRight, Clock } from "@medusajs/icons"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/account/bookings/")({
  component: BookingsPage,
})

const statusColors: Record<string, string> = {
  confirmed: "bg-ds-success text-ds-success",
  pending: "bg-ds-warning text-ds-warning",
  canceled: "bg-ds-destructive text-ds-destructive",
  completed: "bg-ds-info text-ds-info",
  no_show: "bg-ds-muted text-ds-foreground",
}

function BookingsPage() {
  const { tenant, locale } = Route.useParams() as { locale: string }
  const { data: bookings, isLoading } = useCustomerBookings()
  const baseHref = `/${tenant}/${locale}`
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming")

  const now = new Date()
  const filteredBookings = bookings?.filter((booking) => {
    const bookingDate = new Date(booking.scheduled_at)
    if (filter === "upcoming") return bookingDate > now && booking.status !== "canceled"
    if (filter === "past") return bookingDate <= now || booking.status === "completed"
    return true
  })

  return (
    <AccountLayout title={t(locale, "account.bookings_title", "Bookings")} description={t(locale, "account.bookings_description", "Manage your scheduled appointments")}>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(["upcoming", "past", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === f
                ? "bg-ds-primary text-ds-primary-foreground"
                : "bg-ds-background text-ds-muted-foreground border border-ds-border hover:bg-ds-muted"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-ds-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !filteredBookings?.length ? (
        <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
          <Calendar className="h-12 w-12 text-ds-muted-foreground mx-auto mb-4" />
          <p className="text-ds-muted-foreground mb-4">
            {filter === "upcoming"
              ? "No upcoming bookings"
              : filter === "past"
              ? "No past bookings"
              : "No bookings yet"}
          </p>
          <Link
            to={`${baseHref}/bookings` as any}
            className="inline-flex items-center text-sm font-medium text-ds-foreground hover:underline"
          >
            Book a service
            <ChevronRight className="h-4 w-4 ms-1" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const scheduledDate = new Date(booking.scheduled_at || booking.start_time)
            const serviceName = booking.service?.name || booking.customer_notes || "Booking"
            const servicePrice = booking.service?.price || booking.total || booking.subtotal || 0
            const serviceCurrency = booking.service?.currency_code || booking.currency_code || "sar"
            const serviceDuration = booking.service?.duration
            return (
              <Link
                key={booking.id}
                to={`${baseHref}/account/bookings/${booking.id}` as any}
                className="flex items-center gap-4 p-4 bg-ds-background rounded-lg border border-ds-border hover:border-ds-border transition-colors"
              >
                {/* Date Box */}
                <div className="flex flex-col items-center justify-center w-16 h-16 bg-ds-muted rounded-lg flex-shrink-0">
                  <span className="text-xs font-medium text-ds-muted-foreground uppercase">
                    {scheduledDate.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span className="text-2xl font-bold text-ds-foreground">
                    {scheduledDate.getDate()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ds-foreground">{serviceName}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-sm text-ds-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {scheduledDate.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                    {booking.provider && (
                      <span className="text-sm text-ds-muted-foreground">with {booking.provider.name}</span>
                    )}
                  </div>
                  <span
                    className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${
                      statusColors[booking.status] || "bg-ds-muted text-ds-foreground"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                {/* Price */}
                <div className="text-end flex-shrink-0">
                  <p className="font-semibold text-ds-foreground">
                    {formatPrice(servicePrice, serviceCurrency)}
                  </p>
                  {serviceDuration && (
                    <p className="text-sm text-ds-muted-foreground">{serviceDuration} min</p>
                  )}
                </div>

                <ChevronRight className="h-5 w-5 text-ds-muted-foreground flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </AccountLayout>
  )
}
