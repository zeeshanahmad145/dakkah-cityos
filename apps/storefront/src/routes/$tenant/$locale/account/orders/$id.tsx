import { createFileRoute, Link } from "@tanstack/react-router"
import { getMedusaPublishableKey } from "@/lib/utils/env"
import { AccountLayout } from "@/components/account"
import { OrderDetail } from "@/components/orders"
import { useOrder } from "@/lib/hooks/use-orders"
import { ArrowLeft, Spinner } from "@medusajs/icons"

export const Route = createFileRoute("/$tenant/$locale/account/orders/$id")({
  loader: async ({ params }) => {
    try {
      const { getServerBaseUrl, fetchWithTimeout } = await import(
        "@/lib/utils/env"
      )
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(
        `${baseUrl}/store/orders/${params.id}`,
        {
          headers: { "x-publishable-api-key": getMedusaPublishableKey() },
        },
      )
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: data.item || data.order || data }
    } catch {
      return { item: null }
    }
  },
  component: OrderDetailPage,
})

function OrderDetailPage() {
  const { tenant, locale, id } = Route.useParams() as {
    tenant: string
    locale: string
    id: string
  }
  const { data: order, isLoading, error } = useOrder({ order_id: id })
  const baseHref = `/${tenant}/${locale}`

  if (isLoading) {
    return (
      <AccountLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner className="w-8 h-8 animate-spin text-ds-muted-foreground" />
        </div>
      </AccountLayout>
    )
  }

  if (error || !order) {
    return (
      <AccountLayout>
        <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
          <p className="text-ds-muted-foreground mb-4">Order not found</p>
          <Link
            to={`${baseHref}/account/orders` as never}
            className="text-sm font-medium text-ds-foreground hover:underline"
          >
            Back to orders
          </Link>
        </div>
      </AccountLayout>
    )
  }

  return (
    <AccountLayout>
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          to={`${baseHref}/account/orders` as never}
          className="inline-flex items-center text-sm text-ds-muted-foreground hover:text-ds-foreground"
        >
          <ArrowLeft className="h-4 w-4 me-2" />
          Back to orders
        </Link>

        <OrderDetail order={order as any} />
      </div>
    </AccountLayout>
  )
}
