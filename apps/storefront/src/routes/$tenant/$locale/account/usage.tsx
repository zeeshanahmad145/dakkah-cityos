// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/account/usage/")({
  component: UsageDashboardPage,
  head: () => ({
    meta: [
      { title: "Usage Dashboard | Dakkah CityOS" },
      {
        name: "description",
        content: "Track your usage and consumption for metered services",
      },
    ],
  }),
})

const METER_ICONS: Record<string, string> = {
  api_calls: "⚡",
  storage_gb: "💾",
  bandwidth_gb: "📡",
  ai_tokens: "🤖",
  transactions: "💳",
  sms: "📱",
  email: "📧",
  analytics_events: "📊",
}

function UsageDashboardPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [period, setPeriod] = useState<"current" | "last">("current")
  const [usageData, setUsageData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const load = async (p: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/metering/usage?period=${p}`, {
        credentials: "include",
      })
      const data = await res.json()
      setUsageData(data.usage ?? [])
    } catch {
      setUsageData([])
    } finally {
      setIsLoading(false)
      setLoaded(true)
    }
  }

  if (!loaded && !isLoading) load(period)

  const totalBilled = usageData.reduce((s, u) => s + (u.billed_amount ?? 0), 0)

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 text-white py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-white/70 mb-4">
            <Link
              to={`${prefix}/account` as never}
              className="hover:text-white"
            >
              Account
            </Link>
            <span>/</span>
            <span className="text-white">Usage</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Usage Dashboard</h1>
          <p className="text-white/80">
            Track your metered service consumption and billing
          </p>
          <div className="mt-4 text-lg font-semibold">
            Total this period: SAR {totalBilled.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Period selector */}
        <div className="flex gap-3 mb-6">
          {(["current", "last"] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p)
                load(p)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${period === p ? "bg-violet-600 text-white border-violet-600" : "border-ds-border text-ds-foreground hover:bg-ds-muted/50"}`}
            >
              {p === "current" ? "Current Period" : "Last Period"}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 border border-ds-border rounded-xl animate-pulse bg-ds-muted/20"
              />
            ))}
          </div>
        )}

        {!isLoading && loaded && usageData.length === 0 && (
          <div className="text-center py-20 text-ds-muted-foreground">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">
              No usage recorded yet
            </h2>
            <p>
              Your metered service usage will appear here once you start using
              APIs, storage, or other metered services.
            </p>
          </div>
        )}

        {!isLoading && usageData.length > 0 && (
          <>
            {/* Summary grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {usageData.map((u: any) => (
                <div
                  key={u.meter_type}
                  className="border border-ds-border rounded-xl p-5 bg-ds-background hover:shadow-md transition-shadow"
                >
                  <div className="text-2xl mb-2">
                    {METER_ICONS[u.meter_type] ?? "📈"}
                  </div>
                  <div className="text-xs text-ds-muted-foreground uppercase tracking-wide mb-1">
                    {u.meter_type?.replace(/_/g, " ")}
                  </div>
                  <div className="text-2xl font-bold text-ds-foreground">
                    {(u.units ?? 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-ds-muted-foreground mt-1">
                    {u.unit_label ?? "units"}
                  </div>
                  {u.limit && (
                    <>
                      <div className="mt-3 h-1.5 bg-ds-muted/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (u.units / u.limit) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-ds-muted-foreground mt-1">
                        {u.units} / {u.limit} limit
                      </div>
                    </>
                  )}
                  {u.billed_amount > 0 && (
                    <div className="mt-2 text-sm font-semibold text-violet-600">
                      SAR {u.billed_amount.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Upcoming billing notice */}
            <div className="border border-violet-200 bg-violet-50 rounded-xl p-5">
              <h3 className="font-semibold text-violet-800 mb-1">
                Billing Cycle
              </h3>
              <p className="text-sm text-violet-700">
                Usage is billed at the end of each calendar month. Upgrade your
                plan to increase limits or switch to a flat-rate plan for
                predictable billing.
              </p>
              <Link
                to={`${prefix}/subscriptions` as never}
                className="mt-3 inline-block text-sm font-medium text-violet-700 underline hover:text-violet-900"
              >
                View subscription plans →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
