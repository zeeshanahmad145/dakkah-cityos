import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Badge, Button, Input, Label, toast } from "@medusajs/ui"
import { BuildingStorefront, Plus } from "@medusajs/icons"
import { useState } from "react"
import { DataTable } from "../../components/tables/data-table.js"
import { StatusBadge } from "../../components/common"
import { StatsGrid } from "../../components/charts/stats-grid.js"
import { FormDrawer } from "../../components/forms/form-drawer.js"
import { useRestaurants, useCreateRestaurant } from "../../hooks/use-restaurants.js"
import type { Restaurant } from "../../hooks/use-restaurants.js"

const RestaurantsPage = () => {
  const { data, isLoading } = useRestaurants()
  const createRestaurant = useCreateRestaurant()
  const [showCreate, setShowCreate] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const restaurants = data?.items || []
  const activeCount = restaurants.filter((r: any) => r.is_active !== false).length

  const stats = [
    { label: "Total Restaurants", value: restaurants.length, icon: <BuildingStorefront className="w-5 h-5" /> },
    { label: "Active", value: activeCount, color: "green" as const },
    { label: "Accepting Orders", value: restaurants.filter((r: any) => r.is_accepting_orders).length, color: "blue" as const },
    { label: "Total Listed", value: restaurants.length, color: "purple" as const },
  ]

  const columns = [
    { key: "name", header: "Restaurant", sortable: true, cell: (r: Restaurant) => (
      <div><Text className="font-medium">{r.name}</Text><Text className="text-ui-fg-muted text-sm">{r.handle}</Text></div>
    )},
    { key: "cuisine_types", header: "Cuisine", cell: (r: Restaurant) => <Badge color="grey">{Array.isArray(r.cuisine_types) ? r.cuisine_types.join(", ") : "—"}</Badge> },
    { key: "city", header: "Location", cell: (r: Restaurant) => (
      <div><Text className="text-sm">{r.city}</Text><Text className="text-ui-fg-muted text-sm">{r.country_code}</Text></div>
    )},
    { key: "avg_prep_time_minutes", header: "Prep Time", sortable: true, cell: (r: Restaurant) => r.avg_prep_time_minutes ? `${r.avg_prep_time_minutes} min` : "—" },
    { key: "delivery_fee", header: "Delivery Fee", cell: (r: Restaurant) => r.delivery_fee != null ? `$${r.delivery_fee}` : "—" },
    { key: "is_active", header: "Status", cell: (r: Restaurant) => <StatusBadge status={r.is_active !== false ? "active" : "inactive"} /> },
  ]

  const handleCreate = () => {
    createRestaurant.mutate({
      name: formData.name,
      tenant_id: formData.tenant_id,
      handle: formData.handle,
      address_line1: formData.address_line1,
      city: formData.city,
      postal_code: formData.postal_code,
      country_code: formData.country_code || "us",
    }, {
      onSuccess: () => { toast.success("Restaurant created"); setShowCreate(false); setFormData({}) },
      onError: () => toast.error("Failed to create restaurant"),
    })
  }

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div><Heading level="h1">Restaurant Management</Heading><Text className="text-ui-fg-muted">Manage restaurants, menus, and orders</Text></div>
          <Button variant="secondary" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" />Add Restaurant</Button>
        </div>
      </div>

      <div className="p-6"><StatsGrid stats={stats} columns={4} /></div>

      <div className="px-6 pb-6">
        <DataTable data={restaurants} columns={columns} searchable searchPlaceholder="Search restaurants..." searchKeys={["name", "city", "handle"]} loading={isLoading} emptyMessage="No restaurants found" />
      </div>

      <FormDrawer open={showCreate} onOpenChange={setShowCreate} title="Create Restaurant" description="Add a new restaurant" onSubmit={handleCreate} loading={createRestaurant.isPending}>
        <div className="flex flex-col gap-4">
          <div><Label>Name</Label><Input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value as any })} /></div>
          <div><Label>Tenant ID</Label><Input value={formData.tenant_id || ""} onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value as any })} /></div>
          <div><Label>Handle</Label><Input value={formData.handle || ""} onChange={(e) => setFormData({ ...formData, handle: e.target.value as any })} /></div>
          <div><Label>Address</Label><Input value={formData.address_line1 || ""} onChange={(e) => setFormData({ ...formData, address_line1: e.target.value as any })} /></div>
          <div><Label>City</Label><Input value={formData.city || ""} onChange={(e) => setFormData({ ...formData, city: e.target.value as any })} /></div>
          <div><Label>Postal Code</Label><Input value={formData.postal_code || ""} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value as any })} /></div>
          <div><Label>Country Code</Label><Input value={formData.country_code || ""} onChange={(e) => setFormData({ ...formData, country_code: e.target.value as any })} placeholder="us" /></div>
        </div>
      </FormDrawer>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Restaurants", icon: BuildingStorefront })
export default RestaurantsPage
