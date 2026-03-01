import { createFileRoute } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { OrderList } from "@/components/orders"
import { useCustomerOrders } from "@/lib/hooks/use-orders"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/account/orders/")({
  component: OrdersPage,
})

function OrdersPage() {
  const { locale, tenant } = Route.useParams()
  const { data: orders, isLoading } = useCustomerOrders({
    fields: "*items,*items.thumbnail",
  })

  return (
    <AccountLayout
      title={t(locale, "account.orders_title", "Orders")}
      description={t(
        locale,
        "account.orders_description",
        "View and track your orders",
      )}
    >
      <OrderList orders={(orders || []) as any[]} isLoading={isLoading} />
    </AccountLayout>
  )
}
