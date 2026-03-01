import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Input, toast, Label } from "@medusajs/ui"
import { DocumentText, PencilSquare, CheckCircle, XCircle } from "@medusajs/icons"
import { useState } from "react"
import { useQuotes, useUpdateQuote, useApproveQuote, useRejectQuote, Quote } from "../../hooks/use-quotes.js"
import { DataTable } from "../../components/tables/data-table.js"
import { StatusBadge } from "../../components/common"
import { StatsGrid } from "../../components/charts/stats-grid.js"
import { FormDrawer } from "../../components/forms/form-drawer.js"

const QuotesPage = () => {
  const [editing, setEditing] = useState<Quote | null>(null)
  const [formData, setFormData] = useState({
    custom_discount_percentage: "",
    custom_discount_amount: "",
    discount_reason: "",
    valid_until: "",
    internal_notes: "",
    rejection_reason: "",
  })

  const { data: quotesData, isLoading } = useQuotes()
  const updateQuote = useUpdateQuote()
  const approveQuote = useApproveQuote()
  const rejectQuote = useRejectQuote()

  const quotes = quotesData?.quotes || []

  const stats = [
    { label: "Total Quotes", value: quotes.length, icon: <DocumentText className="w-5 h-5" /> },
    { label: "Pending Review", value: quotes.filter(q => q.status === "submitted" || q.status === "under_review").length, color: "orange" as const },
    { label: "Approved", value: quotes.filter(q => q.status === "approved").length, color: "green" as const },
    { label: "Rejected / Expired", value: quotes.filter(q => q.status === "rejected" || q.status === "expired").length, color: "red" as const },
  ]

  const handleSubmit = async () => {
    if (!editing) return
    try {
      await updateQuote.mutateAsync({
        id: editing.id,
        custom_discount_percentage: formData.custom_discount_percentage ? Number(formData.custom_discount_percentage) : undefined,
        custom_discount_amount: formData.custom_discount_amount ? Number(formData.custom_discount_amount) : undefined,
        discount_reason: formData.discount_reason || undefined,
        valid_until: formData.valid_until || undefined,
        internal_notes: formData.internal_notes || undefined,
      })
      toast.success("Quote updated")
      setEditing(null)
    } catch (error) {
      toast.error("Failed to update quote")
    }
  }

  const openEdit = (q: Quote) => {
    setFormData({
      custom_discount_percentage: q.custom_discount_percentage ? String(q.custom_discount_percentage) : "",
      custom_discount_amount: q.custom_discount_amount ? String(q.custom_discount_amount) : "",
      discount_reason: q.discount_reason || "",
      valid_until: q.valid_until?.split("T")[0] || "",
      internal_notes: q.internal_notes || "",
      rejection_reason: "",
    })
    setEditing(q)
  }

  const handleApprove = async (q: Quote) => {
    try {
      await approveQuote.mutateAsync({
        id: q.id,
        valid_until: formData.valid_until || undefined,
        internal_notes: formData.internal_notes || undefined,
      })
      toast.success("Quote approved")
      setEditing(null)
    } catch (error) {
      toast.error("Failed to approve quote")
    }
  }

  const handleReject = async (q: Quote) => {
    try {
      await rejectQuote.mutateAsync({
        id: q.id,
        rejection_reason: formData.rejection_reason || undefined,
        internal_notes: formData.internal_notes || undefined,
      })
      toast.success("Quote rejected")
      setEditing(null)
    } catch (error) {
      toast.error("Failed to reject quote")
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100)
  }

  const columns = [
    { key: "quote_number", header: "Quote #", sortable: true, cell: (q: Quote) => (
      <Text className="font-medium font-mono">{q.quote_number}</Text>
    )},
    { key: "company", header: "Company", cell: (q: Quote) => (
      <div>
        <Text className="font-medium">{q.company?.name || q.company_id}</Text>
        {q.company?.email && <Text className="text-ui-fg-muted text-sm">{q.company.email}</Text>}
      </div>
    )},
    { key: "customer", header: "Customer", cell: (q: Quote) => (
      <div>
        <Text className="font-medium">{q.customer?.first_name} {q.customer?.last_name}</Text>
        <Text className="text-ui-fg-muted text-sm">{q.customer?.email || q.customer_email}</Text>
      </div>
    )},
    { key: "total", header: "Total", sortable: true, cell: (q: Quote) => (
      <Text className="font-medium">{formatCurrency(q.total || q.total_amount || 0, q.currency_code)}</Text>
    )},
    { key: "items_count", header: "Items", cell: (q: Quote) => `${q.items_count || q.items?.length || 0} items` },
    { key: "status", header: "Status", cell: (q: Quote) => <StatusBadge status={q.status} /> },
    { key: "valid_until", header: "Valid Until", sortable: true, cell: (q: Quote) => q.valid_until?.split("T")[0] || "-" },
    { key: "actions", header: "", width: "140px", cell: (q: Quote) => (
      <div className="flex gap-1">
        <Button variant="transparent" size="small" onClick={() => openEdit(q)}><PencilSquare className="w-4 h-4" /></Button>
        {(q.status === "submitted" || q.status === "under_review") && (
          <>
            <Button variant="transparent" size="small" onClick={() => handleApprove(q)}><CheckCircle className="w-4 h-4 text-ui-tag-green-text" /></Button>
            <Button variant="transparent" size="small" onClick={() => handleReject(q)}><XCircle className="w-4 h-4 text-ui-tag-red-text" /></Button>
          </>
        )}
      </div>
    )},
  ]

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div><Heading level="h1">Quotes</Heading><Text className="text-ui-fg-muted">Manage customer quotes, approvals, and pricing</Text></div>
        </div>
      </div>
      <div className="p-6"><StatsGrid stats={stats} columns={4} /></div>
      <div className="px-6 pb-6">
        <DataTable data={quotes} columns={columns} searchable searchPlaceholder="Search quotes..." searchKeys={["quote_number" as keyof Quote]} loading={isLoading} emptyMessage="No quotes found" />
      </div>
      <FormDrawer open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null) }} title="Manage Quote" onSubmit={handleSubmit} submitLabel="Update" loading={updateQuote.isPending || approveQuote.isPending || rejectQuote.isPending}>
        <div className="space-y-4">
          {editing && (
            <div>
              <Text className="text-sm text-ui-fg-muted">Quote: {editing.quote_number} — {editing.company?.name}</Text>
              <Text className="text-sm text-ui-fg-muted">Customer: {editing.customer?.first_name} {editing.customer?.last_name}</Text>
              <Text className="text-sm font-medium mt-1">Status: {editing.status}</Text>
            </div>
          )}
          <div><Label htmlFor="custom_discount_percentage">Discount Percentage</Label><Input id="custom_discount_percentage" type="number" step="0.01" value={formData.custom_discount_percentage} onChange={(e) => setFormData({ ...formData, custom_discount_percentage: e.target.value as any })} placeholder="e.g. 10" /></div>
          <div><Label htmlFor="custom_discount_amount">Discount Amount (cents)</Label><Input id="custom_discount_amount" type="number" value={formData.custom_discount_amount} onChange={(e) => setFormData({ ...formData, custom_discount_amount: e.target.value as any })} placeholder="e.g. 5000" /></div>
          <div><Label htmlFor="discount_reason">Discount Reason</Label><Input id="discount_reason" value={formData.discount_reason} onChange={(e) => setFormData({ ...formData, discount_reason: e.target.value as any })} placeholder="Reason for discount..." /></div>
          <div><Label htmlFor="valid_until">Valid Until</Label><Input id="valid_until" type="date" value={formData.valid_until} onChange={(e) => setFormData({ ...formData, valid_until: e.target.value as any })} /></div>
          <div><Label htmlFor="internal_notes">Internal Notes</Label><Input id="internal_notes" value={formData.internal_notes} onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value as any })} placeholder="Internal notes..." /></div>
          {editing && (editing.status === "submitted" || editing.status === "under_review") && (
            <>
              <div><Label htmlFor="rejection_reason">Rejection Reason (if rejecting)</Label><Input id="rejection_reason" value={formData.rejection_reason} onChange={(e) => setFormData({ ...formData, rejection_reason: e.target.value as any })} placeholder="Reason for rejection..." /></div>
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => editing && handleApprove(editing)} disabled={approveQuote.isPending}>
                  <CheckCircle className="w-4 h-4 mr-2" />Approve
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => editing && handleReject(editing)} disabled={rejectQuote.isPending}>
                  <XCircle className="w-4 h-4 mr-2" />Reject
                </Button>
              </div>
            </>
          )}
        </div>
      </FormDrawer>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Quotes", icon: DocumentText })
export default QuotesPage
