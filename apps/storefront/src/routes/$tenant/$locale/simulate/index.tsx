// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/simulate/")({
  component: SimulatePage,
  head: () => ({
    meta: [
      { title: "Cost Estimator | Dakkah CityOS" },
      {
        name: "description",
        content:
          "Estimate refund amounts, upgrade costs, and settlement previews",
      },
    ],
  }),
})

type Tab = "refund" | "upgrade" | "settlement"

function SimulatePage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [tab, setTab] = useState<Tab>("refund")
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Refund form
  const [refundForm, setRefundForm] = useState({
    order_id: "",
    refund_amount: "",
  })
  // Upgrade form
  const [upgradeForm, setUpgradeForm] = useState({
    from_plan: "",
    to_plan: "",
    from_price: "",
    to_price: "",
    days_remaining: "",
    total_days: "30",
  })
  // Settlement form
  const [settlementForm, setSettlementForm] = useState({
    gross_revenue: "",
    commission_pct: "15",
    tax_pct: "15",
    refunds_total: "0",
  })

  const simulate = async () => {
    setIsLoading(true)
    setResult(null)
    try {
      let res
      if (tab === "refund") {
        res = await fetch("/api/simulate/refund", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            order_id: refundForm.order_id,
            refund_amount: parseFloat(refundForm.refund_amount),
          }),
        })
      } else if (tab === "upgrade") {
        res = await fetch("/api/simulate/upgrade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            from_plan_id: upgradeForm.from_plan,
            to_plan_id: upgradeForm.to_plan,
            from_price: parseFloat(upgradeForm.from_price),
            to_price: parseFloat(upgradeForm.to_price),
            remaining_days: parseInt(upgradeForm.days_remaining),
            total_days: parseInt(upgradeForm.total_days),
          }),
        })
      } else {
        res = await fetch("/api/simulate/settlement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            gross_revenue: parseFloat(settlementForm.gross_revenue),
            commission_pct: parseFloat(settlementForm.commission_pct),
            tax_pct: parseFloat(settlementForm.tax_pct),
            refunds_total: parseFloat(settlementForm.refunds_total),
          }),
        })
      }
      const data = await res!.json()
      setResult(data)
    } catch {
      setResult({ error: "Simulation failed. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "refund", label: "Refund Estimate", icon: "↩️" },
    { id: "upgrade", label: "Plan Upgrade", icon: "⬆️" },
    { id: "settlement", label: "Payout Preview", icon: "💰" },
  ]

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">
            {t(locale, "simulate.title", "Cost Estimator")}
          </h1>
          <p className="text-white/80">
            {t(
              locale,
              "simulate.subtitle",
              "Preview refunds, upgrade costs, and payout amounts before committing",
            )}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Tab switcher */}
        <div className="flex gap-2 mb-6 border border-ds-border rounded-xl p-1 bg-ds-background">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => {
                setTab(tb.id)
                setResult(null)
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${tab === tb.id ? "bg-emerald-600 text-white" : "text-ds-foreground hover:bg-ds-muted/50"}`}
            >
              <span>{tb.icon}</span>
              {tb.label}
            </button>
          ))}
        </div>

        <div className="border border-ds-border rounded-xl p-6 bg-ds-background mb-4">
          {tab === "refund" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-ds-foreground">
                Estimate Your Refund
              </h2>
              <input
                placeholder="Order ID (optional)"
                value={refundForm.order_id}
                onChange={(e) =>
                  setRefundForm((f) => ({ ...f, order_id: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-ds-border rounded-lg text-sm bg-ds-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="number"
                placeholder="Refund amount (SAR)"
                value={refundForm.refund_amount}
                onChange={(e) =>
                  setRefundForm((f) => ({
                    ...f,
                    refund_amount: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 border border-ds-border rounded-lg text-sm bg-ds-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
          {tab === "upgrade" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-ds-foreground">
                Calculate Upgrade Cost
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Current plan name"
                  value={upgradeForm.from_plan}
                  onChange={(e) =>
                    setUpgradeForm((f) => ({ ...f, from_plan: e.target.value }))
                  }
                  className="px-4 py-2.5 border border-ds-border rounded-lg text-sm bg-ds-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  placeholder="New plan name"
                  value={upgradeForm.to_plan}
                  onChange={(e) =>
                    setUpgradeForm((f) => ({ ...f, to_plan: e.target.value }))
                  }
                  className="px-4 py-2.5 border border-ds-border rounded-lg text-sm bg-ds-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Current plan price (SAR/mo)"
                  value={upgradeForm.from_price}
                  onChange={(e) =>
                    setUpgradeForm((f) => ({
                      ...f,
                      from_price: e.target.value,
                    }))
                  }
                  className="px-4 py-2.5 border border-ds-border rounded-lg text-sm bg-ds-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="number"
                  placeholder="New plan price (SAR/mo)"
                  value={upgradeForm.to_price}
                  onChange={(e) =>
                    setUpgradeForm((f) => ({ ...f, to_price: e.target.value }))
                  }
                  className="px-4 py-2.5 border border-ds-border rounded-lg text-sm bg-ds-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Days remaining in cycle"
                  value={upgradeForm.days_remaining}
                  onChange={(e) =>
                    setUpgradeForm((f) => ({
                      ...f,
                      days_remaining: e.target.value,
                    }))
                  }
                  className="px-4 py-2.5 border border-ds-border rounded-lg text-sm bg-ds-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
          {tab === "settlement" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-ds-foreground">
                Vendor Payout Preview
              </h2>
              <input
                type="number"
                placeholder="Gross revenue (SAR)"
                value={settlementForm.gross_revenue}
                onChange={(e) =>
                  setSettlementForm((f) => ({
                    ...f,
                    gross_revenue: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 border border-ds-border rounded-lg text-sm bg-ds-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  placeholder="Commission %"
                  value={settlementForm.commission_pct}
                  onChange={(e) =>
                    setSettlementForm((f) => ({
                      ...f,
                      commission_pct: e.target.value,
                    }))
                  }
                  className="px-4 py-2.5 border border-ds-border rounded-lg text-sm bg-ds-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Tax % (VAT)"
                  value={settlementForm.tax_pct}
                  onChange={(e) =>
                    setSettlementForm((f) => ({
                      ...f,
                      tax_pct: e.target.value,
                    }))
                  }
                  className="px-4 py-2.5 border border-ds-border rounded-lg text-sm bg-ds-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Total refunds (SAR)"
                  value={settlementForm.refunds_total}
                  onChange={(e) =>
                    setSettlementForm((f) => ({
                      ...f,
                      refunds_total: e.target.value,
                    }))
                  }
                  className="px-4 py-2.5 border border-ds-border rounded-lg text-sm bg-ds-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            onClick={simulate}
            disabled={isLoading}
            className="mt-5 w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {isLoading ? "Calculating…" : "Calculate"}
          </button>
        </div>

        {/* Result */}
        {result && !result.error && (
          <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-6">
            <h3 className="font-semibold text-emerald-800 mb-4">Breakdown</h3>
            <div className="space-y-2">
              {(result.preview?.line_items ?? []).map(
                (item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-ds-foreground">{item.label}</span>
                    <span
                      className={`font-medium ${item.type === "credit" ? "text-green-600" : item.type === "debit" ? "text-red-600" : "text-ds-foreground"}`}
                    >
                      {item.amount >= 0 ? "" : "-"}SAR{" "}
                      {Math.abs(item.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ),
              )}
            </div>
            {result.warnings?.length > 0 && (
              <div className="mt-4 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
                {result.warnings.map((w: string, i: number) => (
                  <p key={i}>⚠️ {w}</p>
                ))}
              </div>
            )}
          </div>
        )}
        {result?.error && (
          <div className="border border-red-200 bg-red-50 rounded-xl p-4 text-red-700 text-sm">
            {result.error}
          </div>
        )}
      </div>
    </div>
  )
}
