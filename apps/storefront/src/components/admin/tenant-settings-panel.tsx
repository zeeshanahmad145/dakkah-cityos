import { useTenantSettings, useTenantBilling, useTenantUsage, useTenantInvoices } from "@/lib/hooks/use-tenant-admin"
import type { TenantSettings, TenantBilling, TenantUsageRecord, TenantInvoice } from "@/lib/types/tenant-admin"

export function TenantSettingsPanel() {
  const { data: settingsData, isLoading: loadingSettings } = useTenantSettings()
  const { data: billingData, isLoading: loadingBilling } = useTenantBilling()
  const { data: usageData, isLoading: loadingUsage } = useTenantUsage()
  const { data: invoicesData, isLoading: loadingInvoices } = useTenantInvoices()

  const isLoading = loadingSettings || loadingBilling

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-6 animate-pulse">
            <div className="h-5 bg-muted rounded w-1/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const settings = settingsData?.settings
  const billing = billingData?.billing
  const usage = usageData?.records?.[0]
  const invoices = invoicesData?.invoices || []

  return (
    <div className="space-y-6">
      {billing && <BillingCard billing={billing} />}
      {settings && <SettingsCard settings={settings} />}
      {usage && <UsageCard usage={usage} />}
      {invoices.length > 0 && <InvoicesList invoices={invoices} />}
    </div>
  )
}

function BillingCard({ billing }: { billing: TenantBilling }) {
  const planColors: Record<string, string> = {
    free: "bg-ds-muted text-ds-foreground",
    starter: "bg-ds-info text-ds-info",
    professional: "bg-ds-accent/10 text-ds-accent",
    enterprise: "bg-ds-warning/15 text-ds-warning",
  }

  const planName = billing.plan_name || billing.plan || "N/A"
  const planKey = (billing.plan || billing.plan_name || "").toLowerCase()

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold text-lg mb-4">Billing</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Plan</p>
          <span className={`px-3 py-1 rounded text-sm font-medium ${planColors[planKey] || "bg-ds-muted"}`}>
            {String(planName).charAt(0).toUpperCase() + String(planName).slice(1)}
          </span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Monthly Amount</p>
          <p className="font-bold text-xl">${billing.monthly_amount || 0}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="font-medium">{billing.subscription_status || billing.status || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Next Billing</p>
          <p className="font-medium">
            {billing.next_billing_date || billing.next_invoice_date
              ? new Date(billing.next_billing_date || billing.next_invoice_date || "").toLocaleDateString()
              : "N/A"}
          </p>
        </div>
      </div>
    </div>
  )
}

function SettingsCard({ settings }: { settings: TenantSettings }) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold text-lg mb-4">Settings</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground mb-1">Commerce</p>
          <p>Currency: {settings.default_currency}</p>
          <p>Tax inclusive: {settings.tax_inclusive_pricing ? "Yes" : "No"}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Limits</p>
          {settings.limits?.max_products && <p>Products: {settings.limits.max_products}</p>}
          {settings.limits?.max_vendors && <p>Vendors: {settings.limits.max_vendors}</p>}
          {settings.limits?.max_users && <p>Users: {settings.limits.max_users}</p>}
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Notifications</p>
          <p>New Order: {settings.notify_on_new_order ? "On" : "Off"}</p>
          <p>Low Stock: {settings.notify_on_low_stock ? "On" : "Off"}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Localization</p>
          <p>Locale: {settings.default_locale}</p>
          <p>Timezone: {settings.timezone}</p>
          {settings.features && Object.entries(settings.features).slice(0, 2).map(([key, enabled]) => (
            <p key={key}>
              {key}: {enabled ? "Enabled" : "Disabled"}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

function UsageCard({ usage }: { usage: TenantUsageRecord }) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold text-lg mb-4">Current Usage</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricItem label="Type" value={usage.usage_type} />
        <MetricItem label="Quantity" value={usage.quantity.toLocaleString()} />
        <MetricItem label="Period Start" value={new Date(usage.period_start!).toLocaleDateString()} />
        <MetricItem label="Period End" value={new Date(usage.period_end!).toLocaleDateString()} />
        {usage.metrics && (
          <>
            {usage.metrics.api_calls !== undefined && <MetricItem label="API Calls" value={usage.metrics.api_calls.toLocaleString()} />}
            {usage.metrics.storage_used_mb !== undefined && <MetricItem label="Storage" value={`${(usage.metrics.storage_used_mb / 1024).toFixed(1)} GB`} />}
            {usage.metrics.active_products !== undefined && <MetricItem label="Products" value={usage.metrics.active_products.toString()} />}
            {usage.metrics.orders_processed !== undefined && <MetricItem label="Orders" value={usage.metrics.orders_processed.toString()} />}
          </>
        )}
      </div>
    </div>
  )
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-bold text-lg">{value}</p>
    </div>
  )
}

function InvoicesList({ invoices }: { invoices: TenantInvoice[] }) {
  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b bg-muted/20">
        <h3 className="font-semibold">Billing History</h3>
      </div>
      <div className="divide-y">
        {invoices.map((invoice: TenantInvoice) => (
          <div key={invoice.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{invoice.invoice_number || `Invoice #${invoice.id.slice(0, 8)}`}</p>
              {invoice.period_start && invoice.period_end && (
                <p className="text-sm text-muted-foreground">
                  {new Date(invoice.period_start!).toLocaleDateString()} - {new Date(invoice.period_end!).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {invoice.total !== undefined && <span className="font-bold">${invoice.total.toFixed(2)}</span>}
              {invoice.status && (
                <span className={`px-2 py-0.5 rounded text-xs ${invoice.status === "paid" ? "bg-ds-success text-ds-success" : invoice.status === "overdue" ? "bg-ds-destructive text-ds-destructive" : "bg-ds-warning text-ds-warning"}`}>
                  {invoice.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
