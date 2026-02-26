// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"
import { ReviewListBlock } from '@/components/blocks/review-list-block'

function normalizeDetail(item: any) {
  if (!item) return null
  const meta = typeof item.metadata === "string" ? JSON.parse(item.metadata) : (item.metadata || {})
  return {
    ...meta,
    ...item,
    thumbnail: item.thumbnail || meta.thumbnail || meta.images?.[0] || null,
    description: item.description || meta.description || "",
    service_name: meta.name || item.service_name || item.product_id || "Booking",
    provider_name: meta.provider_name || item.provider_name || null,
    price: item.price ?? meta.price ?? null,
    currency: item.currency || meta.currency || "SAR",
    start_time: item.start_time || meta.start_time || null,
    end_time: item.end_time || meta.end_time || null,
    status: item.status || meta.status || "pending",
    notes: item.notes || meta.notes || null,
    location: item.location || meta.location || null,
    duration_minutes: item.duration_minutes || meta.duration_minutes || null,
    created_at: item.created_at || meta.created_at || null,
  }
}

export const Route = createFileRoute("/$tenant/$locale/bookings/$id")({
  component: BookingDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.service_name || "Booking Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/bookings/${params.id}`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return null
      const data = await resp.json()
      return normalizeDetail(data.booking || data.item || data)
    } catch {
      return null
    }
  },
})

const statusStyles: Record<string, string> = {
  pending: "bg-ds-warning/20 text-ds-warning",
  confirmed: "bg-ds-info/20 text-ds-info",
  checked_in: "bg-ds-success/20 text-ds-success",
  completed: "bg-ds-success/20 text-ds-success",
  cancelled: "bg-ds-destructive/20 text-ds-destructive",
  no_show: "bg-ds-muted text-ds-muted-foreground",
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked In",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
}

function BookingDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [cancelling, setCancelling] = useState(false)
  const [cancelSuccess, setCancelSuccess] = useState(false)

  const booking = Route.useLoaderData()

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return t(locale, "verticals.contact_pricing")
    const amount = price >= 100 ? price / 100 : price
    return `${amount.toLocaleString()} ${currency}`
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—"
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return
    setCancelling(true)
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/bookings/${id}/cancel`, {
        method: "POST",
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
          "Content-Type": "application/json",
        },
      })
      if (resp.ok) {
        setCancelSuccess(true)
      }
    } catch {
    } finally {
      setCancelling(false)
    }
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Booking Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This booking may have been removed or is no longer available.</p>
            <Link to={`${prefix}/bookings` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Services
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const canCancel = ["pending", "confirmed"].includes(booking.status)
  const displayStatus = cancelSuccess ? "cancelled" : booking.status

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">{t(locale, "common.home")}</Link>
            <span>/</span>
            <Link to={`${prefix}/bookings` as any} className="hover:text-ds-foreground transition-colors">Bookings</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{booking.service_name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {booking.thumbnail && (
              <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
                <img loading="lazy" src={booking.thumbnail} alt={booking.service_name} className="w-full h-full object-cover" />
              </div>
            )}

            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{booking.service_name}</h1>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusStyles[displayStatus] || statusStyles.pending}`}>
                  {statusLabels[displayStatus] || displayStatus}
                </span>
              </div>
              {booking.provider_name && (
                <p className="text-sm text-ds-muted-foreground mt-2">Provider: {booking.provider_name}</p>
              )}
            </div>

            {cancelSuccess && (
              <div className="bg-ds-destructive/10 border border-ds-destructive/20 rounded-xl p-4 text-sm text-ds-destructive">
                Your booking has been successfully cancelled.
              </div>
            )}

            {booking.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Service Description</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{booking.description}</p>
              </div>
            )}

            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <h2 className="font-semibold text-ds-foreground mb-4">Booking Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ds-muted-foreground">Booking ID</span>
                  <span className="text-ds-foreground font-mono text-xs">{booking.id}</span>
                </div>
                {booking.start_time && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ds-muted-foreground">Start Time</span>
                    <span className="text-ds-foreground font-medium">{formatDateTime(booking.start_time)}</span>
                  </div>
                )}
                {booking.end_time && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ds-muted-foreground">End Time</span>
                    <span className="text-ds-foreground font-medium">{formatDateTime(booking.end_time)}</span>
                  </div>
                )}
                {booking.duration_minutes && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ds-muted-foreground">Duration</span>
                    <span className="text-ds-foreground font-medium">{booking.duration_minutes} minutes</span>
                  </div>
                )}
                {booking.location && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ds-muted-foreground">Location</span>
                    <span className="text-ds-foreground font-medium">{booking.location}</span>
                  </div>
                )}
                {booking.created_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ds-muted-foreground">Booked On</span>
                    <span className="text-ds-foreground font-medium">{formatDateTime(booking.created_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {booking.notes && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Notes</h2>
                <p className="text-ds-muted-foreground text-sm whitespace-pre-wrap">{booking.notes}</p>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                {booking.price != null && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-ds-primary">{formatPrice(booking.price, booking.currency)}</p>
                    <p className="text-xs text-ds-muted-foreground mt-1">Total Price</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-ds-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-ds-foreground">Status: <span className="font-medium capitalize">{statusLabels[displayStatus] || displayStatus}</span></span>
                  </div>
                </div>

                {canCancel && !cancelSuccess && (
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="w-full py-2.5 px-4 text-sm font-medium text-ds-destructive bg-ds-destructive/10 border border-ds-destructive/20 rounded-lg hover:bg-ds-destructive/20 transition-colors disabled:opacity-50"
                    >
                      {cancelling ? "Cancelling..." : "Cancel Booking"}
                    </button>
                  </div>
                )}

                <Link
                  to={`${prefix}/bookings` as any}
                  className="block w-full py-2.5 px-4 text-sm font-medium text-center text-ds-foreground bg-ds-muted rounded-lg hover:bg-ds-muted/80 transition-colors"
                >
                  Back to Services
                </Link>
              </div>

              {booking.provider_name && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Service Provider</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-ds-primary/10 flex items-center justify-center text-ds-primary font-bold">
                      {booking.provider_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ds-foreground">{booking.provider_name}</p>
                      {booking.location && (
                        <p className="text-xs text-ds-muted-foreground">{booking.location}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
      <ReviewListBlock productId={booking.id || id} heading="Reviews" />
    </div>
  )
}
