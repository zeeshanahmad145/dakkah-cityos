import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Badge, Input, toast, Label } from "@medusajs/ui"
import { FlyingBox, Plus, PencilSquare } from "@medusajs/icons"
import { useState } from "react"
import { useCarrierConfigs, useCreateCarrierConfig, CarrierConfig } from "../../hooks/use-shipping-ext.js"
import { DataTable } from "../../components/tables/data-table.js"
import { StatusBadge } from "../../components/common"
import { StatsGrid } from "../../components/charts/stats-grid.js"
import { FormDrawer } from "../../components/forms/form-drawer.js"

const ShippingPage = () => {
  const [showDrawer, setShowDrawer] = useState(false)
  const [formData, setFormData] = useState<{ name: string; carrier_code: string; supported_services: string; weight_unit: string; dimension_unit: string }>({ name: "", carrier_code: "", supported_services: "", weight_unit: "kg", dimension_unit: "cm" })

  const { data: carriersData, isLoading } = useCarrierConfigs()
  const createCarrier = useCreateCarrierConfig()

  const carriers = carriersData?.carriers || []

  const activeCarriers = carriers.filter(c => c.is_active)

  const stats = [
    { label: "Total Carriers", value: carriers.length, icon: <FlyingBox className="w-5 h-5" /> },
    { label: "Active Carriers", value: activeCarriers.length, color: "green" as const },
    { label: "Total Services", value: activeCarriers.reduce((s, c) => s + (c.supported_services?.length || 0), 0), color: "blue" as const },
    { label: "Inactive", value: carriers.filter(c => !c.is_active).length, color: "orange" as const },
  ]

  const handleSubmit = async () => {
    try {
      await createCarrier.mutateAsync({
        name: formData.name,
        carrier_code: formData.carrier_code,
        supported_services: formData.supported_services.split(",").map(s => s.trim()).filter(Boolean),
        weight_unit: formData.weight_unit as "kg" | "lb",
        dimension_unit: formData.dimension_unit as "cm" | "in",
        is_active: true,
      })
      toast.success("Carrier created")
      setShowDrawer(false)
      setFormData({ name: "", carrier_code: "", supported_services: "", weight_unit: "kg", dimension_unit: "cm" })
    } catch (error) {
      toast.error("Failed to create carrier")
    }
  }

  const columns = [
    { key: "name", header: "Carrier", sortable: true, cell: (c: CarrierConfig) => (
      <div><Text className="font-medium">{c.name}</Text><Text className="text-ui-fg-muted text-sm">{c.carrier_code}</Text></div>
    )},
    { key: "is_active", header: "Status", cell: (c: CarrierConfig) => <StatusBadge status={c.is_active ? "active" : "inactive"} /> },
    { key: "supported_services", header: "Services", cell: (c: CarrierConfig) => <div className="flex gap-1 flex-wrap">{c.supported_services?.slice(0, 3).map(s => <Badge key={s} color="grey">{s}</Badge>)}{(c.supported_services?.length || 0) > 3 && <Badge color="grey">+{c.supported_services!.length - 3}</Badge>}</div> },
    { key: "weight_unit", header: "Units", cell: (c: CarrierConfig) => <Badge color="blue">{c.weight_unit} / {c.dimension_unit}</Badge> },
    { key: "default_service", header: "Default", cell: (c: CarrierConfig) => c.default_service || "-" },
    { key: "actions", header: "", width: "80px", cell: () => (
      <Button variant="transparent" size="small"><PencilSquare className="w-4 h-4" /></Button>
    )},
  ]

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div><Heading level="h1">Shipping & Carriers</Heading><Text className="text-ui-fg-muted">Manage shipping carriers, zones, and rates</Text></div>
          <Button onClick={() => { setFormData({ name: "", carrier_code: "", supported_services: "", weight_unit: "kg", dimension_unit: "cm" }); setShowDrawer(true) }}><Plus className="w-4 h-4 mr-2" />Add Carrier</Button>
        </div>
      </div>
      <div className="p-6"><StatsGrid stats={stats} columns={4} /></div>
      <div className="px-6 pb-6">
        <DataTable data={carriers} columns={columns} searchable searchPlaceholder="Search carriers..." searchKeys={["name", "carrier_code"]} loading={isLoading} emptyMessage="No carriers found" />
      </div>
      <FormDrawer open={showDrawer} onOpenChange={(open) => { if (!open) setShowDrawer(false) }} title="Add Carrier" onSubmit={handleSubmit} submitLabel="Add" loading={createCarrier.isPending}>
        <div className="space-y-4">
          <div><Label htmlFor="name">Carrier Name</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value as any })} placeholder="FedEx Express" /></div>
          <div><Label htmlFor="code">Carrier Code</Label><Input id="code" value={formData.carrier_code} onChange={(e) => setFormData({ ...formData, carrier_code: e.target.value as any })} placeholder="FEDEX" /></div>
          <div>
            <Label htmlFor="weight_unit">Weight Unit</Label>
            <select id="weight_unit" value={formData.weight_unit} onChange={(e) => setFormData({ ...formData, weight_unit: e.target.value as string })} className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base">
              <option value="kg">Kilograms (kg)</option><option value="lb">Pounds (lb)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="dimension_unit">Dimension Unit</Label>
            <select id="dimension_unit" value={formData.dimension_unit} onChange={(e) => setFormData({ ...formData, dimension_unit: e.target.value as string })} className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base">
              <option value="cm">Centimeters (cm)</option><option value="in">Inches (in)</option>
            </select>
          </div>
          <div><Label htmlFor="services">Supported Services (comma-separated)</Label><Input id="services" value={formData.supported_services} onChange={(e) => setFormData({ ...formData, supported_services: e.target.value as any })} placeholder="express, ground, overnight" /></div>
        </div>
      </FormDrawer>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Shipping", icon: FlyingBox })
export default ShippingPage
