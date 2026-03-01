import { createFileRoute } from "@tanstack/react-router"
import {
  AccountLayout,
  DashboardStats,
  RecentOrders,
  ActiveSubscriptions,
  UpcomingBookings,
} from "@/components/account"
import { useCustomerOrders } from "@/lib/hooks/use-orders"
import { useCustomerSubscriptions } from "@/lib/hooks/use-subscriptions"
import { useCustomerBookings } from "@/lib/hooks/use-bookings"

export const Route = createFileRoute("/$tenant/$locale/account/")({
  component: AccountDashboard,
})

function AccountDashboard() {
  const { data: orders, isLoading: ordersLoading } = useCustomerOrders()
  const { data: subscriptions, isLoading: subscriptionsLoading } =
    useCustomerSubscriptions()
  const { data: bookings, isLoading: bookingsLoading } = useCustomerBookings()

  // Calculate stats
  const orderCount = orders?.length || 0
  const activeSubscriptions =
    subscriptions?.filter((s) => s.status === "active") || []
  const upcomingBookings =
    bookings?.filter(
      (b) => b.status === "confirmed" && new Date(b.scheduled_at!) > new Date(),
    ) || []
  const pendingShipments =
    orders?.filter(
      (o) =>
        o.fulfillment_status === "not_fulfilled" ||
        o.fulfillment_status === "partially_fulfilled",
    ).length || 0

  return (
    <AccountLayout>
      <div className="space-y-6">
        <DashboardStats
          orderCount={orderCount}
          subscriptionCount={activeSubscriptions.length}
          bookingCount={upcomingBookings.length}
          pendingShipments={pendingShipments}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentOrders
            orders={(orders || []) as any[]}
            isLoading={ordersLoading}
          />
          <div className="space-y-6">
            <ActiveSubscriptions
              subscriptions={subscriptions || []}
              isLoading={subscriptionsLoading}
            />
            <UpcomingBookings
              bookings={bookings || []}
              isLoading={bookingsLoading}
            />
          </div>
        </div>
      </div>
    </AccountLayout>
  )
}
