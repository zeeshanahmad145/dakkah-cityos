import { createFileRoute } from "@tanstack/react-router"
import { VendorDashboard } from "@/components/vendor/vendor-dashboard"
import VendorPerformanceCard from "@/components/vendor/vendor-performance-card"
import VendorAnalyticsDashboard from "@/components/vendor/vendor-analytics-dashboard"
import { VendorLayout } from "@/components/vendor/vendor-layout"
import { useAuth } from "@/lib/context/auth-context"
import { useMemo } from "react"

export const Route = createFileRoute("/$tenant/$locale/vendor/")({
  component: VendorDashboardRoute,
})

function VendorDashboardRoute() {
  const { locale } = Route.useParams() as { locale: string }
  const auth = useAuth()

  const vendorId = useMemo(() => {
    const user = auth?.customer || (auth as any)?.user
    if (user?.vendor_id) return user.vendor_id
    if (user?.metadata?.vendor_id) return user.metadata.vendor_id
    if (user?.id) return user.id
    return "current-vendor"
  }, [auth])

  return (
    <VendorLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <VendorDashboard />
          <VendorAnalyticsDashboard vendorId={vendorId} locale={locale} />
        </div>
        <aside className="space-y-6">
          <VendorPerformanceCard vendorId={vendorId} locale={locale} />
        </aside>
      </div>
    </VendorLayout>
  )
}
