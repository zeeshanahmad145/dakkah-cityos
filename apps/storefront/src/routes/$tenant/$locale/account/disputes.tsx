import { createFileRoute } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { DisputeCard } from "@/components/payments/disputes/dispute-card"
import DisputeForm from "@/components/disputes/dispute-form"
import DisputeTimeline from "@/components/disputes/dispute-timeline"
import RefundTracker from "@/components/disputes/refund-tracker"
import { t } from "@/lib/i18n"
import { useState, useEffect } from "react"
import { clsx } from "clsx"

export const Route = createFileRoute("/$tenant/$locale/account/disputes")({
  component: DisputesPage,
})

type DisputeFilter = "all" | "open" | "resolved"

function DisputesPage() {
  const { tenant, locale } = Route.useParams() as { tenant: string; locale: string }
  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState<DisputeFilter>("all")
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [disputeOrderId, setDisputeOrderId] = useState("")
  const [selectedDispute, setSelectedDispute] = useState<{ id: string; orderId: string; status: string; amount: number; currency: string; events: any[] } | null>(null)
  const [disputes] = useState<{ id: string; orderId: string; reason: string; description: string; status: "open" | "under_review" | "resolved" | "rejected" | "escalated"; createdAt: string; updatedAt: string; amount: number; currency: string; events: any[] }[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDisputeCardClick = (disputeId: string) => {
    const dispute = disputes.find((d) => d.id === disputeId)
    if (dispute) {
      setSelectedDispute({
        id: dispute.id,
        orderId: dispute.orderId,
        status: dispute.status,
        amount: dispute.amount,
        currency: dispute.currency,
        events: dispute.events || [],
      })
    }
  }

  const filteredDisputes = disputes.filter((d) => {
    if (filter === "open") return ["open", "under_review", "escalated"].includes(d.status)
    if (filter === "resolved") return ["resolved", "rejected"].includes(d.status)
    return true
  })

  if (!mounted) {
    return (
      <div className="min-h-screen bg-ds-muted flex items-center justify-center">
        <p className="text-sm text-ds-muted-foreground">{t(locale, "common.loading")}</p>
      </div>
    )
  }

  const filters: { key: DisputeFilter; label: string }[] = [
    { key: "all", label: t(locale, "disputes.filter_all") },
    { key: "open", label: t(locale, "disputes.filter_open") },
    { key: "resolved", label: t(locale, "disputes.filter_resolved") },
  ]

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ds-foreground">{t(locale, "disputes.title")}</h1>
            <p className="text-sm text-ds-muted-foreground mt-1">{t(locale, "disputes.subtitle")}</p>
          </div>
          <button
            onClick={() => setShowDisputeForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-ds-primary rounded-lg hover:opacity-90 transition-opacity"
          >
            {t(locale, "disputes.file_dispute")}
          </button>
        </div>

        {showDisputeForm && (
          <div className="bg-ds-background rounded-lg border border-ds-border p-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ds-foreground">{t(locale, "disputes.order_id_label") !== "disputes.order_id_label" ? t(locale, "disputes.order_id_label") : "Order ID"}</span>
              <input
                type="text"
                value={disputeOrderId}
                onChange={(e) => setDisputeOrderId(e.target.value)}
                placeholder={t(locale, "disputes.order_id_placeholder") !== "disputes.order_id_placeholder" ? t(locale, "disputes.order_id_placeholder") : "Enter the order ID to dispute"}
                className="mt-1 block w-full rounded-md border border-ds-border bg-ds-background px-3 py-2 text-sm text-ds-foreground placeholder:text-ds-muted-foreground focus:border-ds-primary focus:outline-none focus:ring-1 focus:ring-ds-primary"
              />
            </label>
            {disputeOrderId.trim() ? (
              <DisputeForm
                orderId={disputeOrderId.trim()}
                locale={locale}
                onSubmit={() => { setShowDisputeForm(false); setDisputeOrderId(""); }}
                onCancel={() => { setShowDisputeForm(false); setDisputeOrderId(""); }}
              />
            ) : (
              <p className="text-sm text-ds-muted-foreground">{t(locale, "disputes.enter_order_id") !== "disputes.enter_order_id" ? t(locale, "disputes.enter_order_id") : "Please enter an order ID above to file a dispute."}</p>
            )}
          </div>
        )}

        <div className="flex gap-2 border-b border-ds-border">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={clsx(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                filter === f.key
                  ? "border-ds-primary text-ds-primary"
                  : "border-transparent text-ds-muted-foreground hover:text-ds-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {selectedDispute && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ds-foreground">
                {t(locale, "disputes.details") !== "disputes.details" ? t(locale, "disputes.details") : "Dispute Details"}
              </h2>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-sm text-ds-muted-foreground hover:text-ds-foreground"
              >
                {t(locale, "common.close") !== "common.close" ? t(locale, "common.close") : "Close"}
              </button>
            </div>
            <DisputeTimeline events={selectedDispute.events} locale={locale} />
            <RefundTracker
              disputeId={selectedDispute.id}
              status={selectedDispute.status}
              amount={selectedDispute.amount}
              currency={selectedDispute.currency}
              locale={locale}
            />
          </div>
        )}

        {filteredDisputes.length > 0 && (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => (
              <div key={dispute.id} role="button" tabIndex={0} onClick={() => handleDisputeCardClick(dispute.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleDisputeCardClick(dispute.id) } }} className="cursor-pointer">
                <DisputeCard
                  dispute={dispute}
                  onViewDetails={handleDisputeCardClick}
                  locale={locale}
                />
              </div>
            ))}
          </div>
        )}

        {filteredDisputes.length === 0 && (
        <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-ds-muted flex items-center justify-center mx-auto mb-4">
            <span className="text-xl text-ds-muted-foreground">⚖</span>
          </div>
          <p className="text-ds-muted-foreground">{t(locale, "disputes.no_disputes")}</p>
          <p className="text-xs text-ds-muted-foreground mt-2">{t(locale, "disputes.no_disputes_description")}</p>
          <p className="text-xs text-ds-muted-foreground mt-1">{t(locale, "disputes.click_card_hint") !== "disputes.click_card_hint" ? t(locale, "disputes.click_card_hint") : "Click on a dispute card to view its timeline and refund status."}</p>
        </div>
        )}
      </div>
    </AccountLayout>
  )
}
