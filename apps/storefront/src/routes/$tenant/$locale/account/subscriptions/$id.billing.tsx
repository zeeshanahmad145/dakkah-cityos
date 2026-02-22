import { createFileRoute, Link } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { BillingHistory } from "@/components/subscriptions/billing-history"
import { PaymentMethodCard } from "@/components/subscriptions/payment-method-card"
import { ArrowLeft, Spinner } from "@medusajs/icons"
import { useSubscription } from "@/lib/hooks/use-subscriptions"
import { useQuery, useMutation } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"

export const Route = createFileRoute("/$tenant/$locale/account/subscriptions/$id/billing")({
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/subscriptions/${params.id}`, {
        headers: { "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_8284bf2e6620fac6cd844648a64e64ed0b4a0cf402d4dfc66725ffc67854d8a6" },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: data.subscription || data }
    } catch { return { item: null } }
  },
  head: () => ({
    meta: [
      { title: "Billing & Payments" },
      { name: "description", content: "Manage your subscription billing and payment methods" },
    ],
  }),
  component: BillingPage,
})

function BillingPage() {
  const { tenant, locale, id } = Route.useParams()

  // Fetch real subscription data
  const { data: subscriptionData, isLoading: subLoading } = useSubscription(id)
  const subscription = (subscriptionData as any)?.subscription || subscriptionData

  // Fetch billing history
  const { data: billingData, isLoading: billingLoading } = useQuery({
    queryKey: ["subscription-billing", id],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ 
        invoices: Array<{
          id: string
          date: string
          amount: number
          currency_code: string
          status: "paid" | "pending" | "failed"
          invoice_url?: string
        }>
      }>(`/store/subscriptions/${id}/billing-history`, {
        method: "GET",
      })
      return response
    },
    enabled: !!id,
  })

  // Fetch payment method
  const { data: paymentData, isLoading: paymentLoading } = useQuery({
    queryKey: ["subscription-payment-method", id],
    queryFn: async () => {
      const response = await sdk.client.fetch<{
        payment_method: {
          id: string
          type: "card" | "bank"
          last4: string
          brand?: string
          expiryMonth?: number
          expiryYear?: number
        } | null
      }>(`/store/subscriptions/${id}/payment-method`, {
        method: "GET",
      })
      return response
    },
    enabled: !!id,
  })

  // Update payment method mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await sdk.client.fetch<{ url: string }>(`/store/subscriptions/${id}/payment-method`, {
        method: "PUT",
      })
      return response
    },
    onSuccess: (data) => {
      if (data.url) {
        // Redirect to Stripe payment method update page
        window.location.href = data.url
      }
    },
    onError: () => {
      alert("Failed to update payment method")
    },
  })

  const isLoading = subLoading || billingLoading || paymentLoading

  const invoices = (billingData?.invoices || []).map((inv: any) => ({
    id: inv.id,
    date: inv.date,
    amount: inv.amount,
    currency_code: inv.currency_code,
    status: inv.status,
    invoice_url: inv.invoice_url,
  }))

  const paymentMethod = paymentData?.payment_method || null

  const handleDownloadInvoice = async (invoiceId: string) => {
    const invoice = invoices.find((inv: any) => inv.id === invoiceId)
    if (invoice?.invoice_url) {
      window.open(invoice.invoice_url, "_blank")
    } else {
      alert("Invoice not available for download")
    }
  }

  const handleUpdatePayment = () => {
    updatePaymentMutation.mutate()
  }

  if (isLoading) {
    return (
      <AccountLayout>
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-8 h-8 animate-spin text-ds-muted-foreground" />
        </div>
      </AccountLayout>
    )
  }

  if (!subscription) {
    return (
      <AccountLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-ds-foreground mb-2">Subscription not found</h1>
          <Link to={`/${tenant}/${locale}/account/subscriptions` as any} className="text-ds-info hover:underline">
            View all subscriptions
          </Link>
        </div>
      </AccountLayout>
    )
  }

  return (
    <AccountLayout>
      <div className="max-w-2xl">
        {/* Back Link */}
        <Link
          to={`/${tenant}/${locale}/account/subscriptions/${id}` as any}
          className="inline-flex items-center gap-2 text-sm text-ds-muted-foreground hover:text-ds-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Subscription
        </Link>

        <h1 className="text-2xl font-bold text-ds-foreground mb-6">Billing & Payments</h1>

        <div className="space-y-6">
          {paymentMethod ? (
            <PaymentMethodCard 
              paymentMethod={paymentMethod} 
              onUpdate={handleUpdatePayment}
            />
          ) : (
            <div className="bg-ds-background rounded-xl border border-ds-border p-6">
              <h3 className="font-semibold text-ds-foreground mb-2">Payment Method</h3>
              <p className="text-ds-muted-foreground text-sm mb-4">No payment method on file</p>
              <button
                onClick={handleUpdatePayment}
                className="px-4 py-2 bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary transition-colors text-sm"
              >
                Add Payment Method
              </button>
            </div>
          )}
          
          {invoices.length > 0 ? (
            <BillingHistory 
              invoices={invoices} 
              onDownload={handleDownloadInvoice}
            />
          ) : (
            <div className="bg-ds-background rounded-xl border border-ds-border p-6">
              <h3 className="font-semibold text-ds-foreground mb-2">Billing History</h3>
              <p className="text-ds-muted-foreground text-sm">No invoices yet</p>
            </div>
          )}
        </div>
      </div>
    </AccountLayout>
  )
}
