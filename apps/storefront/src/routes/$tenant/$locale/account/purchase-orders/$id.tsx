import { createFileRoute, Link } from "@tanstack/react-router"
import { getMedusaPublishableKey } from "@/lib/utils/env"
import { AccountLayout } from "@/components/account"
import { PODetail, POApprovalFlow, POTimeline, POLineItems } from "@/components/purchase-orders"
import { usePurchaseOrder, useApprovePurchaseOrder, useRejectPurchaseOrder } from "@/lib/hooks/use-purchase-orders"
import { useAuth } from "@/lib/context/auth-context"
import { ArrowLeft } from "@medusajs/icons"

export const Route = createFileRoute("/$tenant/$locale/account/purchase-orders/$id")({
  loader: async ({ params }) => {
    try {
      const { getServerBaseUrl, fetchWithTimeout } = await import("@/lib/utils/env")
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/purchase-orders/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: data.item || data.purchase_order || data }
    } catch { return { item: null } }
  },
  component: PurchaseOrderDetailPage,
})

function PurchaseOrderDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const { customer, isB2B } = useAuth()
  const { data: purchaseOrder, isLoading } = usePurchaseOrder(id)
  const approveMutation = useApprovePurchaseOrder()
  const rejectMutation = useRejectPurchaseOrder()

  // Check if current user can approve (simplified - in real app would check role)
  const canApprove = isB2B && purchaseOrder?.status === "pending_approval"

  const handleApprove = async () => {
    if (!purchaseOrder || !customer) return
    await approveMutation.mutateAsync({ poId: purchaseOrder.id, approverId: customer.id })
  }

  const handleReject = async (reason?: string) => {
    if (!purchaseOrder) return
    await rejectMutation.mutateAsync({ poId: purchaseOrder.id, reason })
  }

  if (isLoading) {
    return (
      <AccountLayout>
        <div className="text-center py-12">
          <p className="text-ds-muted-foreground">Loading purchase order...</p>
        </div>
      </AccountLayout>
    )
  }

  if (!purchaseOrder) {
    return (
      <AccountLayout>
        <div className="text-center py-12">
          <p className="text-ds-muted-foreground">Purchase order not found</p>
          <Link
            to={`/${tenant}/${locale}/account/purchase-orders` as any}
            className="text-ds-foreground hover:underline mt-2 inline-block"
          >
            Back to Purchase Orders
          </Link>
        </div>
      </AccountLayout>
    )
  }

  return (
    <AccountLayout>
      {/* Back Link */}
      <Link
        to={`/${tenant}/${locale}/account/purchase-orders` as any}
        className="inline-flex items-center gap-2 text-sm text-ds-muted-foreground hover:text-ds-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Purchase Orders
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PODetail purchaseOrder={purchaseOrder} />
          <POLineItems items={purchaseOrder.items || []} currencyCode={purchaseOrder.currency_code} />
        </div>
        <div className="space-y-6">
          <POApprovalFlow
            purchaseOrder={purchaseOrder}
            canApprove={canApprove}
            onApprove={handleApprove}
            onReject={handleReject}
          />
          <POTimeline purchaseOrder={purchaseOrder} />
        </div>
      </div>
    </AccountLayout>
  )
}
