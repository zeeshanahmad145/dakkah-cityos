// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { t } from "@/lib/i18n"
import { useState } from "react"
import { DocumentText } from "@medusajs/icons"
import { useQuotes } from "@/lib/hooks/use-quotes"

export const Route = createFileRoute("/$tenant/$locale/account/quotes")({
  component: QuotesPage,
  head: () => ({
    meta: [
      { title: "Quote Requests" },
      { name: "description", content: "View your quote requests and responses" },
    ],
  }),
})

const STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  draft: "bg-gray-100 text-gray-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-800",
}

function QuotesPage() {
  const { tenant, locale } = Route.useParams() as { tenant: string; locale: string }
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { data, isLoading } = useQuotes()
  const quotes = data?.quotes ?? []
  const filtered = statusFilter === "all" ? quotes : quotes.filter((q) => q.status === statusFilter)

  return (
    <AccountLayout title="Quote Requests" description="View your quote requests and responses">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ds-foreground">Quote Requests</h1>
            <p className="text-sm text-ds-muted-foreground mt-1">View your quote requests and responses</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-ds-border rounded-md px-3 py-1.5 bg-ds-background text-ds-foreground"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
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
              <DocumentText className="h-6 w-6 text-ds-muted-foreground" />
            </div>
            <p className="text-ds-muted-foreground">No quote requests found</p>
            <p className="text-xs text-ds-muted-foreground mt-2">
              {statusFilter !== "all" ? "Try a different filter." : "Your quote requests and responses will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((quote) => {
              const total = (quote.total ?? 0) / 100
              const currency = (quote.currency_code ?? "USD").toUpperCase()
              const itemCount = Array.isArray(quote.items) ? quote.items.length : 0
              return (
                <div
                  key={quote.id}
                  className="bg-ds-background rounded-lg border border-ds-border p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-ds-muted flex items-center justify-center flex-shrink-0">
                      <DocumentText className="h-5 w-5 text-ds-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-ds-foreground text-sm">
                        {quote.quote_number ?? quote.id}
                      </p>
                      <p className="text-xs text-ds-muted-foreground mt-0.5">
                        {new Date(quote.created_at!).toLocaleDateString()}
                        {itemCount > 0 && <span className="ml-2">· {itemCount} item{itemCount !== 1 ? "s" : ""}</span>}
                        {quote.valid_until && (
                          <span className="ml-2">· Valid until: {new Date(quote.valid_until!).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[quote.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {quote.status}
                    </span>
                    {total > 0 && (
                      <p className="font-semibold text-ds-foreground text-sm">
                        {currency} {total.toFixed(2)}
                      </p>
                    )}
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
