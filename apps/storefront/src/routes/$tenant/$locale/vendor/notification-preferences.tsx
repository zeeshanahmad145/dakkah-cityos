// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"
import { t } from "@/lib/i18n"

interface NotificationSetting {
  id: string
  channel: string
  event_type: string
  description?: string
  enabled: boolean
  updated_at: string
}

export const Route = createFileRoute(
  "/$tenant/$locale/vendor/notification-preferences",
)({
  component: VendorNotificationPreferencesRoute,
})

function VendorNotificationPreferencesRoute() {
  const { locale } = Route.useParams()
  const auth = useAuth()
  const [channelFilter, setChannelFilter] = useState<string>("")

  const vendorId = useMemo(() => {
    const user = auth?.user || auth?.customer
    if (user?.vendor_id) return user.vendor_id
    if (user?.metadata?.vendor_id) return user.metadata.vendor_id
    if (user?.id) return user.id
    return "current-vendor"
  }, [auth])

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-notification-preferences", channelFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (channelFilter) params.set("channel", channelFilter)
      const url = `/vendor/notification-preferences${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: NotificationSetting[]; count: number }>(
        url,
        {
          credentials: "include",
        },
      )
    },
  })

  const items = data?.items || []

  const channelIcons: Record<string, string> = {
    email: "✉️",
    sms: "📱",
    push: "🔔",
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
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          Update Settings
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "email", "sms", "push"].map((s) => (
          <button
            key={s}
            onClick={() => setChannelFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-full border transition ${
              channelFilter === s
                ? "bg-ds-primary text-white border-ds-primary"
                : "bg-ds-card hover:bg-ds-muted/50"
            }`}
          >
            {s
              ? `${channelIcons[s] || ""} ${s.toUpperCase()}`
              : t(locale, "verticals.all_channels")}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-ds-muted-foreground">
          <p className="text-lg mb-2">No notification settings configured</p>
          <p className="text-sm">
            Configure your notification preferences to stay informed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((setting) => (
            <div
              key={setting.id}
              className="border rounded-lg p-5 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">
                    {channelIcons[setting.channel] || "📨"}
                  </span>
                  <div>
                    <h3 className="font-semibold">{setting.event_type}</h3>
                    {setting.description && (
                      <p className="text-ds-muted-foreground text-sm">
                        {setting.description}
                      </p>
                    )}
                    <span className="text-xs text-ds-muted-foreground/70 mt-1 inline-block">
                      Channel: {setting.channel.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 text-sm rounded-full font-medium ${
                      setting.enabled
                        ? "bg-ds-success/15 text-ds-success"
                        : "bg-ds-muted text-ds-muted-foreground"
                    }`}
                  >
                    {setting.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
