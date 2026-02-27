// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { t } from "@/lib/i18n"
import { useState } from "react"
import { ReceiptPercent } from "@medusajs/icons"
import { useInvoices } from "@/lib/hooks/use-invoices"

export const Route = createFileRoute("/$tenant/$locale/account/invoices")({
  component: InvoicesPage,
  head: () => ({
    meta: [
      { title: "Invoices" },
      { name: "description", content: "View and download your invoices" },
    ],
  }),
})

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  sent: "bg-blue-100 text-blue-800",
  issued: "bg-blue-100 text-blue-800",
  draft: "bg-gray-100 text-gray-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
  void: "bg-gray-100 text-gray-600",
}

function InvoicesPage() {
  const { tenant, locale } = Route.useParams() as { tenant: string; locale: string }
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { data, isLoading } = useInvoices()
  const invoices = data?.invoices ?? []
  const filtered = statusFilter === "all" ? invoices : invoices.filter((inv) => inv.status === statusFilter)

  return (
    <AccountLayout title="Invoices" description="View and download your invoices">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ds-foreground">Invoices</h1>
            <p className="text-sm text-ds-muted-foreground mt-1">View and download your invoices</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-ds-border rounded-md px-3 py-1.5 bg-ds-background text-ds-foreground"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="sent">Sent</option>
            <option value="issued">Issued</option>
            <option value="draft">Draft</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-ds-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-ds-muted flex items-center justify-center mx-auto mb-4">
              <ReceiptPercent className="h-6 w-6 text-ds-muted-foreground" />
            </div>
            <p className="text-ds-muted-foreground">No invoices found</p>
            <p className="text-xs text-ds-muted-foreground mt-2">
              {statusFilter !== "all" ? "Try a different filter." : "Your invoices will appear here once orders are processed."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((invoice) => {
              const total = (invoice.total ?? 0) / 100
              const currency = (invoice.currency_code ?? "USD").toUpperCase()
              return (
                <div
                  key={invoice.id}
                  className="bg-ds-background rounded-lg border border-ds-border p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-ds-muted flex items-center justify-center flex-shrink-0">
                      <ReceiptPercent className="h-5 w-5 text-ds-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-ds-foreground text-sm">
                        {invoice.invoice_number ?? invoice.id}
                      </p>
                      <p className="text-xs text-ds-muted-foreground mt-0.5">
                        Issued: {new Date(invoice.issue_date ?? invoice.created_at).toLocaleDateString()}
                        {invoice.due_date && (
                          <span className="ml-2">· Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[invoice.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {invoice.status}
                    </span>
                    <p className="font-semibold text-ds-foreground text-sm">
                      {currency} {total.toFixed(2)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AccountLayout>
  )
}
