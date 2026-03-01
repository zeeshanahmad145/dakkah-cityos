import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { sdk } from "@/lib/utils/sdk"
import { Button } from "@/components/ui/button"
import {
  Buildings,
  DocumentText,
  CreditCard,
  Clock,
  CheckCircleSolid,
} from "@medusajs/icons"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface Company {
  id: string
  name: string
  legal_name?: string
  status: "pending" | "active" | "suspended" | "inactive"
  tier: "bronze" | "silver" | "gold" | "platinum"
  credit_limit?: number
  credit_used?: number
  payment_terms?: string
  tax_id?: string
  created_at: string
}

interface CompanyUser {
  id: string
  role: "admin" | "approver" | "buyer" | "viewer"
  spending_limit?: number
  spending_used?: number
  can_approve: boolean
}

interface Quote {
  id: string
  quote_number: string
  status: string
  total: number
  created_at: string
  valid_until?: string
}

export function B2BDashboard() {
  const prefix = useTenantPrefix()

  const { data: companyData, isLoading: loadingCompany } = useQuery({
    queryKey: ["my-company"],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ companies: Company[] }>(
        "/store/companies",
        {
          credentials: "include",
        },
      )
      return response
    },
  })

  const { data: quotesData, isLoading: loadingQuotes } = useQuery({
    queryKey: ["my-quotes"],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ quotes: Quote[] }>(
        "/store/quotes",
        {
          credentials: "include",
        },
      )
      return response
    },
  })

  const company = companyData?.companies?.[0]
  const quotes = quotesData?.quotes || []

  const creditAvailable = company?.credit_limit
    ? company.credit_limit - (company.credit_used || 0)
    : 0
  const creditUsagePercent = company?.credit_limit
    ? ((company.credit_used || 0) / company.credit_limit) * 100
    : 0
  const pendingQuotes = quotes.filter(
    (q: Quote) => q.status === "submitted" || q.status === "under_review",
  ).length
  const approvedQuotes = quotes.filter(
    (q: Quote) => q.status === "approved",
  ).length

  if (loadingCompany) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="text-center py-16">
        <Buildings className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No B2B Account Found</h2>
        <p className="text-muted-foreground mb-6">
          Register your company to access B2B features like quotes, volume
          pricing, and credit terms.
        </p>
        <Link to={`${prefix}/b2b/register` as never}>
          <Button>Register Your Company</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="text-muted-foreground">
            {company.legal_name || "B2B Account Dashboard"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              company.status === "active"
                ? "bg-ds-success text-ds-success"
                : company.status === "pending"
                  ? "bg-ds-warning text-ds-warning"
                  : company.status === "suspended"
                    ? "bg-ds-destructive text-ds-destructive"
                    : "bg-ds-muted text-ds-foreground"
            }`}
          >
            {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
          </span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              company.tier === "platinum"
                ? "bg-ds-accent/10 text-ds-accent"
                : company.tier === "gold"
                  ? "bg-ds-warning text-ds-warning"
                  : company.tier === "silver"
                    ? "bg-ds-muted text-ds-foreground"
                    : "bg-ds-warning text-ds-warning"
            }`}
          >
            {company.tier.charAt(0).toUpperCase() + company.tier.slice(1)}
          </span>
        </div>
      </div>

      {company.status === "pending" && (
        <div className="bg-ds-warning border border-ds-warning rounded-lg p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-ds-warning mt-0.5" />
          <div>
            <h3 className="font-semibold text-ds-warning">
              Account Pending Approval
            </h3>
            <p className="text-sm text-ds-warning">
              Your B2B account is under review. You'll receive an email once
              approved. Some features may be limited until approval.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-ds-background border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Credit Available
            </span>
            <CreditCard className="w-5 h-5 text-ds-success" color="green" />
          </div>
          <p className="text-2xl font-bold">
            ${creditAvailable.toLocaleString()}
          </p>
          {company.credit_limit && (
            <div className="mt-2">
              <div className="h-2 bg-ds-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${creditUsagePercent > 80 ? "bg-ds-destructive" : "bg-ds-success"}`}
                  style={{ width: `${100 - creditUsagePercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${company.credit_used?.toLocaleString() || 0} of $
                {company.credit_limit.toLocaleString()} used
              </p>
            </div>
          )}
        </div>

        <div className="bg-ds-background border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Pending Quotes
            </span>
            <DocumentText className="w-5 h-5 text-ds-info" />
          </div>
          <p className="text-2xl font-bold">{pendingQuotes}</p>
          <p className="text-xs text-muted-foreground mt-2">Awaiting review</p>
        </div>

        <div className="bg-ds-background border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Approved Quotes
            </span>
            <CheckCircleSolid className="w-5 h-5 text-ds-success" />
          </div>
          <p className="text-2xl font-bold">{approvedQuotes}</p>
          <p className="text-xs text-muted-foreground mt-2">Ready to convert</p>
        </div>

        <div className="bg-ds-background border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Payment Terms</span>
            <CreditCard className="w-5 h-5 text-ds-accent" />
          </div>
          <p className="text-2xl font-bold">
            {company.payment_terms || "Net 30"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Standard terms</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to={`${prefix}/quotes/request` as never}>
          <div className="border rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
            <DocumentText className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Request a Quote</h3>
            <p className="text-sm text-muted-foreground">
              Get custom pricing for bulk orders
            </p>
          </div>
        </Link>

        <Link to={`${prefix}/quotes` as never}>
          <div className="border rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
            <Clock className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">View All Quotes</h3>
            <p className="text-sm text-muted-foreground">
              Track and manage your quote requests
            </p>
          </div>
        </Link>

        <Link to={`${prefix}/store` as never}>
          <div className="border rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
            <CreditCard className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Browse Products</h3>
            <p className="text-sm text-muted-foreground">
              Shop with volume discounts
            </p>
          </div>
        </Link>
      </div>

      <div className="border rounded-lg">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Quotes</h2>
          <Link to={`${prefix}/quotes` as never}>
            <Button variant="secondary">View All</Button>
          </Link>
        </div>

        {loadingQuotes ? (
          <div className="p-6 text-center text-muted-foreground">
            Loading...
          </div>
        ) : quotes.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No quotes yet. Request your first quote to get custom pricing.
          </div>
        ) : (
          <div className="divide-y">
            {quotes.slice(0, 5).map((quote) => (
              <Link
                key={quote.id}
                to={`${prefix}/quotes/${quote.id}` as never}
                className="block"
              >
                <div className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{quote.quote_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(quote.created_at!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-end">
                      <QuoteStatusBadge status={quote.status} />
                      <p className="text-sm font-semibold mt-1">
                        ${Number(quote.total || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Company Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Legal Name</p>
            <p className="font-medium">{company.legal_name || company.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tax ID</p>
            <p className="font-medium">{company.tax_id || "Not provided"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Account Created</p>
            <p className="font-medium">
              {new Date(company.created_at!).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Account Tier</p>
            <TierBadge tier={company.tier} />
          </div>
        </div>
      </div>
    </div>
  )
}

function TierBadge({ tier }: { tier: Company["tier"] }) {
  const styles = {
    bronze: "bg-ds-warning text-ds-warning",
    silver: "bg-ds-muted text-ds-foreground",
    gold: "bg-ds-warning text-ds-warning",
    platinum: "bg-ds-accent/10 text-ds-accent",
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[tier]}`}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
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
