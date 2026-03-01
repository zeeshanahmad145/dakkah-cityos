import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Input, toast, Label } from "@medusajs/ui"
import { CurrencyDollar, Plus, PencilSquare, DocumentText } from "@medusajs/icons"
import { useState } from "react"
import { useInvoices, useCreateInvoice, useUpdateInvoice, useSendInvoice, useVoidInvoice, Invoice } from "../../hooks/use-invoices.js"
import { DataTable } from "../../components/tables/data-table.js"
import { StatusBadge } from "../../components/common"
import { StatsGrid } from "../../components/charts/stats-grid.js"
import { FormDrawer } from "../../components/forms/form-drawer.js"

const InvoicesPage = () => {
  const [showDrawer, setShowDrawer] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [formData, setFormData] = useState({
    company_id: "",
    customer_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "",
    payment_terms: "net_30",
    payment_terms_days: "30",
    currency_code: "usd",
    notes: "",
    item_title: "",
    item_quantity: "1",
    item_unit_price: "0",
  })

  const { data: invoicesData, isLoading } = useInvoices()
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()
  const sendInvoice = useSendInvoice()
  const voidInvoice = useVoidInvoice()

  const invoices = invoicesData?.invoices || []

  const stats = [
    { label: "Total Invoices", value: invoices.length, icon: <DocumentText className="w-5 h-5" /> },
    { label: "Paid", value: invoices.filter(i => i.status === "paid").length, color: "green" as const },
    { label: "Sent", value: invoices.filter(i => i.status === "sent").length, color: "blue" as const },
    { label: "Overdue", value: invoices.filter(i => i.status === "overdue").length, color: "red" as const },
  ]

  const handleSubmit = async () => {
    try {
      if (editing) {
        await updateInvoice.mutateAsync({
          id: editing.id,
          due_date: formData.due_date,
          payment_terms: formData.payment_terms,
          payment_terms_days: Number(formData.payment_terms_days),
          notes: formData.notes,
        })
        toast.success("Invoice updated")
        setEditing(null)
      } else {
        await createInvoice.mutateAsync({
          company_id: formData.company_id,
          customer_id: formData.customer_id || undefined,
          issue_date: formData.issue_date,
          due_date: formData.due_date,
          payment_terms: formData.payment_terms,
          payment_terms_days: Number(formData.payment_terms_days),
          currency_code: formData.currency_code,
          notes: formData.notes || undefined,
          items: [{
            title: formData.item_title || "Item",
            quantity: Number(formData.item_quantity),
            unit_price: Number(formData.item_unit_price),
          }],
        })
        toast.success("Invoice created")
      }
      setShowDrawer(false)
      resetForm()
    } catch (error) {
      toast.error(editing ? "Failed to update invoice" : "Failed to create invoice")
    }
  }

  const resetForm = () => {
    setFormData({
      company_id: "",
      customer_id: "",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: "",
      payment_terms: "net_30",
      payment_terms_days: "30",
      currency_code: "usd",
      notes: "",
      item_title: "",
      item_quantity: "1",
      item_unit_price: "0",
    })
  }

  const openEdit = (inv: Invoice) => {
    setFormData({
      company_id: inv.company_id,
      customer_id: inv.customer_id || "",
      issue_date: inv.issue_date?.split("T")[0] || "",
      due_date: inv.due_date?.split("T")[0] || "",
      payment_terms: inv.payment_terms || "net_30",
      payment_terms_days: String(inv.payment_terms_days),
      currency_code: inv.currency_code,
      notes: inv.notes || "",
      item_title: "",
      item_quantity: "1",
      item_unit_price: "0",
    })
    setEditing(inv)
    setShowDrawer(true)
  }

  const handleSend = async (id: string) => {
    try {
      await sendInvoice.mutateAsync(id)
      toast.success("Invoice sent")
    } catch (error) {
      toast.error("Failed to send invoice")
    }
  }

  const handleVoid = async (id: string) => {
    try {
      await voidInvoice.mutateAsync({ id })
      toast.success("Invoice voided")
    } catch (error) {
      toast.error("Failed to void invoice")
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100)
  }

  const columns = [
    { key: "invoice_number", header: "Invoice #", sortable: true, cell: (inv: Invoice) => (
      <Text className="font-medium font-mono">{inv.invoice_number}</Text>
    )},
    { key: "company", header: "Company", cell: (inv: Invoice) => (
      <div>
        <Text className="font-medium">{inv.company?.name || inv.company_id}</Text>
        {inv.company?.email && <Text className="text-ui-fg-muted text-sm">{inv.company.email}</Text>}
      </div>
    )},
    { key: "total", header: "Amount", sortable: true, cell: (inv: Invoice) => (
      <Text className="font-medium">{formatCurrency(inv.total, inv.currency_code)}</Text>
    )},
    { key: "amount_due", header: "Due", cell: (inv: Invoice) => (
      <Text className={inv.amount_due > 0 ? "text-ui-tag-red-text font-medium" : "text-ui-fg-muted"}>
        {formatCurrency(inv.amount_due, inv.currency_code)}
      </Text>
    )},
    { key: "status", header: "Status", cell: (inv: Invoice) => <StatusBadge status={inv.status} /> },
    { key: "due_date", header: "Due Date", sortable: true, cell: (inv: Invoice) => inv.due_date?.split("T")[0] || "-" },
    { key: "actions", header: "", width: "120px", cell: (inv: Invoice) => (
      <div className="flex gap-1">
        <Button variant="transparent" size="small" onClick={() => openEdit(inv)}><PencilSquare className="w-4 h-4" /></Button>
        {inv.status === "draft" && (
          <Button variant="transparent" size="small" onClick={() => handleSend(inv.id)}>Send</Button>
        )}
        {(inv.status === "sent" || inv.status === "overdue") && (
          <Button variant="transparent" size="small" onClick={() => handleVoid(inv.id)}>Void</Button>
        )}
      </div>
    )},
  ]

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div><Heading level="h1">Invoices</Heading><Text className="text-ui-fg-muted">Manage invoices, payments, and billing</Text></div>
          <Button onClick={() => { setEditing(null); resetForm(); setShowDrawer(true) }}><Plus className="w-4 h-4 mr-2" />Create Invoice</Button>
        </div>
      </div>
      <div className="p-6"><StatsGrid stats={stats} columns={4} /></div>
      <div className="px-6 pb-6">
        <DataTable data={invoices} columns={columns} searchable searchPlaceholder="Search invoices..." searchKeys={["invoice_number" as keyof Invoice]} loading={isLoading} emptyMessage="No invoices found" />
      </div>
      <FormDrawer open={showDrawer} onOpenChange={(open) => { if (!open) { setShowDrawer(false); setEditing(null) } }} title={editing ? "Edit Invoice" : "Create Invoice"} onSubmit={handleSubmit} submitLabel={editing ? "Update" : "Create"} loading={createInvoice.isPending || updateInvoice.isPending}>
        <div className="space-y-4">
          {editing && <div><Text className="text-sm text-ui-fg-muted">Invoice: {editing.invoice_number}</Text></div>}
          {!editing && (
            <>
              <div><Label htmlFor="company_id">Company ID</Label><Input id="company_id" value={formData.company_id} onChange={(e) => setFormData({ ...formData, company_id: e.target.value as any })} placeholder="Enter company ID" /></div>
              <div><Label htmlFor="customer_id">Customer ID (optional)</Label><Input id="customer_id" value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value as any })} placeholder="Enter customer ID" /></div>
              <div><Label htmlFor="issue_date">Issue Date</Label><Input id="issue_date" type="date" value={formData.issue_date} onChange={(e) => setFormData({ ...formData, issue_date: e.target.value as any })} /></div>
              <div><Label htmlFor="currency_code">Currency Code</Label><Input id="currency_code" value={formData.currency_code} onChange={(e) => setFormData({ ...formData, currency_code: e.target.value as any })} placeholder="usd" /></div>
            </>
          )}
          <div><Label htmlFor="due_date">Due Date</Label><Input id="due_date" type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value as any })} /></div>
          <div>
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <select id="payment_terms" value={formData.payment_terms} onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value as any })} className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base">
              <option value="net_15">Net 15</option><option value="net_30">Net 30</option><option value="net_45">Net 45</option><option value="net_60">Net 60</option><option value="due_on_receipt">Due on Receipt</option>
            </select>
          </div>
          <div><Label htmlFor="payment_terms_days">Payment Terms Days</Label><Input id="payment_terms_days" type="number" value={formData.payment_terms_days} onChange={(e) => setFormData({ ...formData, payment_terms_days: e.target.value as any })} /></div>
          <div><Label htmlFor="notes">Notes</Label><Input id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value as any })} placeholder="Add notes..." /></div>
          {!editing && (
            <>
              <Heading level="h3" className="pt-2">Line Item</Heading>
              <div><Label htmlFor="item_title">Item Title</Label><Input id="item_title" value={formData.item_title} onChange={(e) => setFormData({ ...formData, item_title: e.target.value as any })} placeholder="Item name" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="item_quantity">Quantity</Label><Input id="item_quantity" type="number" value={formData.item_quantity} onChange={(e) => setFormData({ ...formData, item_quantity: e.target.value as any })} /></div>
                <div><Label htmlFor="item_unit_price">Unit Price (cents)</Label><Input id="item_unit_price" type="number" value={formData.item_unit_price} onChange={(e) => setFormData({ ...formData, item_unit_price: e.target.value as any })} /></div>
              </div>
            </>
          )}
        </div>
      </FormDrawer>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Invoices", icon: CurrencyDollar })
export default InvoicesPage
