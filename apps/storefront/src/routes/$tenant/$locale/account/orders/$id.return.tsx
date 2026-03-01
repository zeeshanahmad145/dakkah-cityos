import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { ReturnRequestForm } from "@/components/delivery/return-request-form"
import { ExchangeSelector } from "@/components/delivery/exchange-selector"
import { RefundStatus } from "@/components/delivery/refund-status"
import { useOrder } from "@/lib/hooks/use-orders"
import { sdk } from "@/lib/utils/sdk"
import { useMutation } from "@tanstack/react-query"
import { t } from "@/lib/i18n"
import { useState } from "react"
import {
  getServerBaseUrl,
  fetchWithTimeout,
  getMedusaPublishableKey,
} from "@/lib/utils/env"

export const Route = createFileRoute(
  "/$tenant/$locale/account/orders/$id/return",
)({
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(
        `${baseUrl}/store/orders/${params.id}`,
        {
          headers: { "x-publishable-api-key": getMedusaPublishableKey() },
        },
      )
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: data.order || data }
    } catch {
      return { item: null }
    }
  },
  head: () => ({
    meta: [
      { title: "Return Order" },
      {
        name: "description",
        content: "Initiate a return or exchange for your order",
      },
    ],
  }),
  component: ReturnRequestPage,
})

const defaultReasons = [
  "Defective or damaged",
  "Wrong item received",
  "Item not as described",
  "Changed my mind",
  "Better price found",
  "No longer needed",
  "Other",
]

function ReturnRequestPage() {
  const { tenant, locale, id } = Route.useParams()
  const navigate = useNavigate()
  const [mode, setMode] = useState<"return" | "exchange">("return")

  const { data: orderData, isLoading } = useOrder({
    order_id: id,
    fields: "+items,+items.variant,+items.variant.product",
  })

  const order = (orderData as any)?.order || orderData

  const returnableItems = (order?.items || []).map((item: any) => ({
    id: item.id,
    title: item.title || item.variant?.product?.title || "Unknown Product",
    thumbnail: item.thumbnail || item.variant?.product?.thumbnail,
    quantity: item.quantity,
    maxReturnQuantity: item.quantity,
    price: {
      amount: (item.unit_price || 0) / 100,
      currency: order?.currency_code || "usd",
    },
  }))

  const submitReturnMutation = useMutation({
    mutationFn: async (data: {
      items: Array<{ itemId: string; quantity: number; reason: string }>
      notes?: string
      preferRefund?: "original" | "store-credit"
    }) => {
      const response = await sdk.client.fetch(`/store/orders/${id}/returns`, {
        method: "POST",
        body: {
          items: data.items.map((item) => ({
            item_id: item.itemId,
            quantity: item.quantity,
            reason: item.reason,
          })),
          note: data.notes,
          refund_preference: data.preferRefund,
        },
      })
      return response
    },
    onSuccess: () => {
      navigate({ to: `/${tenant}/${locale}/account/orders/${id}` })
    },
  })

  const handleSubmit = (data: any) => {
    submitReturnMutation.mutate(data)
  }

  const handleCancel = () => {
    navigate({ to: `/${tenant}/${locale}/account/orders/${id}` })
  }

  if (isLoading) {
    return (
      <AccountLayout>
        <div className="max-w-2xl space-y-4">
          <div className="h-8 w-48 bg-ds-muted rounded animate-pulse" />
          <div className="h-6 w-64 bg-ds-muted rounded animate-pulse" />
          <div className="h-96 bg-ds-muted rounded-xl animate-pulse" />
        </div>
      </AccountLayout>
    )
  }

  if (!order) {
    return (
      <AccountLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-ds-foreground mb-2">
            {t(locale, "delivery.order_not_found")}
          </h1>
          <Link
            to={`/${tenant}/${locale}/account/orders` as never}
            className="text-ds-info hover:underline"
          >
            {t(locale, "delivery.view_all_orders")}
          </Link>
        </div>
      </AccountLayout>
    )
  }

  return (
    <AccountLayout>
      <div className="max-w-2xl">
        <Link
          to={`/${tenant}/${locale}/account/orders/${id}` as never}
          className="inline-flex items-center gap-2 text-sm text-ds-muted-foreground hover:text-ds-foreground mb-6"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          {t(locale, "delivery.back_to_order")}
        </Link>

        <h1 className="text-2xl font-bold text-ds-foreground mb-2">
          {t(locale, "delivery.return_request")}
        </h1>
        <p className="text-ds-muted-foreground mb-6">
          {t(locale, "delivery.select_items_to_return")}
        </p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("return")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === "return"
                ? "bg-ds-primary text-ds-primary-foreground"
                : "bg-ds-background text-ds-muted-foreground border border-ds-border hover:bg-ds-muted"
            }`}
          >
            {t(locale, "delivery.return_request")}
          </button>
          <button
            onClick={() => setMode("exchange")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === "exchange"
                ? "bg-ds-primary text-ds-primary-foreground"
                : "bg-ds-background text-ds-muted-foreground border border-ds-border hover:bg-ds-muted"
            }`}
          >
            {t(locale, "delivery.exchange")}
          </button>
        </div>

        {submitReturnMutation.error && (
          <div className="bg-ds-destructive/10 border border-ds-destructive/20 rounded-lg p-4 text-ds-destructive mb-4 text-sm">
            {submitReturnMutation.error?.message ||
              "Failed to submit return request"}
          </div>
        )}

        {mode === "return" ? (
          <ReturnRequestForm
            orderId={id}
            items={returnableItems}
            reasons={defaultReasons}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            locale={locale}
          />
        ) : (
          returnableItems.length > 0 && (
            <ExchangeSelector
              originalItem={returnableItems[0]}
              exchangeOptions={[]}
              onSelect={() => {}}
              locale={locale}
            />
          )
        )}

        <div className="mt-6 bg-ds-muted rounded-xl p-6">
          <h3 className="font-semibold text-ds-foreground mb-2">
            {t(locale, "delivery.return_policy")}
          </h3>
          <ul className="text-sm text-ds-muted-foreground space-y-2">
            <li>{t(locale, "delivery.return_policy_1")}</li>
            <li>{t(locale, "delivery.return_policy_2")}</li>
            <li>{t(locale, "delivery.return_policy_3")}</li>
            <li>{t(locale, "delivery.return_policy_4")}</li>
          </ul>
        </div>
      </div>
    </AccountLayout>
  )
}
