import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Badge, Input, toast, Label } from "@medusajs/ui"
import { BuildingStorefront, Plus, ExclamationCircle } from "@medusajs/icons"
import { useState } from "react"
import { useStockAlerts, useWarehouseTransfers, StockAlert, WarehouseTransfer } from "../../hooks/use-inventory-ext.js"
import { DataTable } from "../../components/tables/data-table.js"
import { StatusBadge } from "../../components/common"
import { StatsGrid } from "../../components/charts/stats-grid.js"
import { FormDrawer } from "../../components/forms/form-drawer.js"

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState<"alerts" | "transfers">("alerts")
  const [showDrawer, setShowDrawer] = useState(false)
  const [formData, setFormData] = useState({ product_id: "", threshold: "50" })

  const { data: alertsData, isLoading: loadingAlerts } = useStockAlerts()
  const { data: transfersData, isLoading: loadingTransfers } = useWarehouseTransfers()

  const alerts = alertsData?.alerts || []
  const transfers = transfersData?.transfers || []

  const stats = [
    { label: "Total Alerts", value: alerts.length, icon: <BuildingStorefront className="w-5 h-5" /> },
    { label: "Low Stock", value: alerts.filter(a => a.alert_type === "low_stock").length, color: "orange" as const },
    { label: "Out of Stock", value: alerts.filter(a => a.alert_type === "out_of_stock").length, color: "red" as const },
    { label: "Active Transfers", value: transfers.filter(t => t.status === "in_transit" || t.status === "pending").length, color: "blue" as const },
  ]

  const handleSubmit = () => {
    toast.success("Alert created")
    setShowDrawer(false)
    setFormData({ product_id: "", threshold: "50" })
  }

  const alertColumns = [
    { key: "product", header: "Product", sortable: true, cell: (a: StockAlert) => (
      <div><Text className="font-medium">{a.product?.title || a.product_id}</Text></div>
    )},
    { key: "alert_type", header: "Alert Type", cell: (a: StockAlert) => {
      switch (a.alert_type) { case "out_of_stock": return <Badge color="red">Out of Stock</Badge>; case "low_stock": return <Badge color="orange">Low Stock</Badge>; case "overstock": return <Badge color="blue">Overstock</Badge>; default: return <Badge>{a.alert_type}</Badge> }
    }},
    { key: "current_quantity", header: "Current Qty", sortable: true, cell: (a: StockAlert) => <Text className={a.current_quantity === 0 ? "text-ui-tag-red-text font-medium" : ""}>{a.current_quantity}</Text> },
    { key: "threshold", header: "Threshold", cell: (a: StockAlert) => a.threshold },
    { key: "is_resolved", header: "Status", cell: (a: StockAlert) => <Badge color={a.is_resolved ? "green" : "orange"}>{a.is_resolved ? "Resolved" : "Active"}</Badge> },
  ]

  const transferColumns = [
    { key: "id", header: "Transfer ID", cell: (t: WarehouseTransfer) => <Text className="font-medium font-mono">{t.id.slice(0, 12)}</Text> },
    { key: "from", header: "From", cell: (t: WarehouseTransfer) => <Badge color="grey">{t.from_warehouse_id}</Badge> },
    { key: "to", header: "To", cell: (t: WarehouseTransfer) => <Badge color="blue">{t.to_warehouse_id}</Badge> },
    { key: "items", header: "Items", cell: (t: WarehouseTransfer) => `${t.items?.length || 0} items` },
    { key: "status", header: "Status", cell: (t: WarehouseTransfer) => <StatusBadge status={t.status} /> },
  ]

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div><Heading level="h1">Inventory</Heading><Text className="text-ui-fg-muted">Manage stock levels, alerts, and transfers</Text></div>
          <Button onClick={() => setShowDrawer(true)}><Plus className="w-4 h-4 mr-2" />Add Alert</Button>
        </div>
      </div>
      <div className="p-6"><StatsGrid stats={stats} columns={4} /></div>
      <div className="px-6 pb-6">
        <div className="flex gap-4 border-b border-ui-border-base mb-4">
          <button className={`pb-2 px-1 ${activeTab === "alerts" ? "border-b-2 border-ui-fg-base font-medium" : "text-ui-fg-muted"}`} onClick={() => setActiveTab("alerts")}>
            <div className="flex items-center gap-2"><ExclamationCircle className="w-4 h-4" />Alerts ({alerts.length})</div>
          </button>
          <button className={`pb-2 px-1 ${activeTab === "transfers" ? "border-b-2 border-ui-fg-base font-medium" : "text-ui-fg-muted"}`} onClick={() => setActiveTab("transfers")}>
            Transfers ({transfers.length})
          </button>
        </div>
        {activeTab === "alerts" && <DataTable data={alerts} columns={alertColumns} searchable searchPlaceholder="Search alerts..." searchKeys={[]} loading={loadingAlerts} emptyMessage="No alerts" />}
        {activeTab === "transfers" && <DataTable data={transfers} columns={transferColumns} searchable searchPlaceholder="Search transfers..." searchKeys={[]} loading={loadingTransfers} emptyMessage="No transfers" />}
      </div>
      <FormDrawer open={showDrawer} onOpenChange={(open) => { if (!open) setShowDrawer(false) }} title="Add Stock Alert" onSubmit={handleSubmit} submitLabel="Add">
        <div className="space-y-4">
          <div><Label htmlFor="product_id">Product ID</Label><Input id="product_id" value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value as any })} placeholder="prod_xxx" /></div>
          <div><Label htmlFor="threshold">Threshold</Label><Input id="threshold" type="number" value={formData.threshold} onChange={(e) => setFormData({ ...formData, threshold: e.target.value as any })} /></div>
        </div>
      </FormDrawer>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Inventory", icon: BuildingStorefront })
export default InventoryPage
