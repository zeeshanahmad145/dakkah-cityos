import { Link } from "@tanstack/react-router"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface Quote {
  id: string
  quote_number: string
  status: string
  total: number
  created_at: string
  valid_until?: string
  items?: Array<{ id: string }>
}

interface QuoteListProps {
  quotes: Quote[]
}

export function QuoteList({ quotes }: QuoteListProps) {
  const prefix = useTenantPrefix()

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground mb-4">No quotes found</p>
        <Link
          to={`${prefix}/quotes/request` as never}
          className="text-primary hover:underline"
        >
          Request your first quote
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {quotes.map((quote) => (
        <Link
          key={quote.id}
          to={`${prefix}/quotes/${quote.id}` as never}
          className="block"
        >
          <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{quote.quote_number}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(quote.created_at!).toLocaleDateString()}
                  {quote.items && ` - ${quote.items.length} items`}
                </p>
              </div>
              <div className="text-end">
                <QuoteStatusBadge status={quote.status} />
                <p className="text-sm font-semibold mt-1">
                  ${Number(quote.total || 0).toLocaleString()}
                </p>
              </div>
            </div>
            {quote.valid_until && (
              <p className="text-xs text-muted-foreground mt-2">
                Valid until: {new Date(quote.valid_until!).toLocaleDateString()}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

function QuoteStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-ds-muted text-ds-foreground",
    submitted: "bg-ds-info text-ds-info",
    under_review: "bg-ds-warning text-ds-warning",
    approved: "bg-ds-success text-ds-success",
    rejected: "bg-ds-destructive text-ds-destructive",
    accepted: "bg-ds-success text-ds-success",
    declined: "bg-ds-warning/15 text-ds-warning",
    expired: "bg-ds-muted text-ds-foreground",
  }

  const labels: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
    accepted: "Accepted",
    declined: "Declined",
    expired: "Expired",
  }

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || "bg-ds-muted"}`}
    >
      {labels[status] || status}
    </span>
  )
}
