import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { POForm } from "@/components/purchase-orders"
import {
  useCreatePurchaseOrder,
  useSubmitPurchaseOrder,
} from "@/lib/hooks/use-purchase-orders"
import { useAuth } from "@/lib/context/auth-context"
import { ArrowLeft } from "@medusajs/icons"

export const Route = createFileRoute(
  "/$tenant/$locale/account/purchase-orders/new",
)({
  component: NewPurchaseOrderPage,
})

function NewPurchaseOrderPage() {
  const { tenant, locale } = Route.useParams()
  const navigate = useNavigate()
  const { customer } = useAuth()
  const createMutation = useCreatePurchaseOrder()
  const submitMutation = useSubmitPurchaseOrder()

  const handleSubmit = async (data: { items: any[]; notes?: string }) => {
    if (!customer?.company_id) return

    // Create the PO
    const newPO = await createMutation.mutateAsync({
      company_id: customer.company_id,
      created_by: customer.id,
      items: data.items.map((item, index) => ({
        id: `item_${index}`,
        product_id: `prod_${index}`,
        product_title: item.product_title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      })) as any,
      subtotal: data.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0,
      ),
      tax_total: 0,
      shipping_total: 0,
      total: data.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0,
      ),
      currency_code: "usd",
      notes: data.notes,
    })

    // Submit for approval
    await submitMutation.mutateAsync(newPO.id)

    // Navigate to the new PO
    navigate({ to: `/${tenant}/${locale}/account/purchase-orders/${newPO.id}` })
  }

  const handleSaveDraft = async (data: { items: any[]; notes?: string }) => {
    if (!customer?.company_id) return

    const newPO = await createMutation.mutateAsync({
      company_id: customer.company_id,
      created_by: customer.id,
      items: data.items.map((item, index) => ({
        id: `item_${index}`,
        product_id: `prod_${index}`,
        product_title: item.product_title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      })) as any,
      subtotal: data.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0,
      ),
      tax_total: 0,
      shipping_total: 0,
      total: data.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0,
      ),
      currency_code: "usd",
      notes: data.notes,
    })

    navigate({ to: `/${tenant}/${locale}/account/purchase-orders/${newPO.id}` })
  }

  const handleCancel = () => {
    navigate({ to: `/${tenant}/${locale}/account/purchase-orders` })
  }

  return (
    <AccountLayout>
      {/* Back Link */}
      <Link
        to={`/${tenant}/${locale}/account/purchase-orders` as never}
        className="inline-flex items-center gap-2 text-sm text-ds-muted-foreground hover:text-ds-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Purchase Orders
      </Link>

      <div className="max-w-2xl">
        <POForm
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          onCancel={handleCancel}
        />
      </div>
    </AccountLayout>
  )
}
