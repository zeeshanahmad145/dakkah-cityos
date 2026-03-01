import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Badge, Input, toast, Label } from "@medusajs/ui"
import { UserGroup, Plus, PencilSquare, CurrencyDollar } from "@medusajs/icons"
import { useState } from "react"
import { useMembershipPlans, useCreatePlan, useUpdatePlan, MembershipPlan } from "../../hooks/use-memberships.js"
import { DataTable } from "../../components/tables/data-table.js"
import { StatusBadge } from "../../components/common"
import { StatsGrid } from "../../components/charts/stats-grid.js"
import { FormDrawer } from "../../components/forms/form-drawer.js"

const MembershipsPage = () => {
  const [showDrawer, setShowDrawer] = useState(false)
  const [editing, setEditing] = useState<MembershipPlan | null>(null)
  const [formData, setFormData] = useState({ name: "", price: "9.99", duration_days: "30", benefits: "" })

  const { data: plansData, isLoading } = useMembershipPlans()
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()

  const plans = plansData?.plans || []

  const activePlans = plans.filter(p => p.is_active)

  const stats = [
    { label: "Total Plans", value: plans.length, icon: <UserGroup className="w-5 h-5" /> },
    { label: "Active Plans", value: activePlans.length, color: "green" as const },
    { label: "Avg Price", value: activePlans.length ? `$${(activePlans.reduce((s, p) => s + p.price, 0) / activePlans.length).toFixed(2)}` : "$0", icon: <CurrencyDollar className="w-5 h-5" />, color: "green" as const },
    { label: "Inactive", value: plans.filter(p => !p.is_active).length, color: "orange" as const },
  ]

  const handleSubmit = async () => {
    try {
      const benefitsArr = formData.benefits.split(",").map(b => b.trim()).filter(Boolean)
      if (editing) {
        await updatePlan.mutateAsync({ id: editing.id, name: formData.name, price: Number(formData.price), duration_days: Number(formData.duration_days), benefits: benefitsArr })
        toast.success("Plan updated")
        setEditing(null)
      } else {
        await createPlan.mutateAsync({ name: formData.name, price: Number(formData.price), duration_days: Number(formData.duration_days), benefits: benefitsArr, is_active: true })
        toast.success("Plan created")
      }
      setShowDrawer(false)
      setFormData({ name: "", price: "9.99", duration_days: "30", benefits: "" })
    } catch (error) {
      toast.error(editing ? "Failed to update plan" : "Failed to create plan")
    }
  }

  const openEdit = (p: MembershipPlan) => {
    setFormData({ name: p.name, price: String(p.price), duration_days: String(p.duration_days), benefits: p.benefits?.join(", ") || "" })
    setEditing(p)
    setShowDrawer(true)
  }

  const columns = [
    { key: "name", header: "Plan", sortable: true, cell: (p: MembershipPlan) => <Text className="font-medium">{p.name}</Text> },
    { key: "price", header: "Price", sortable: true, cell: (p: MembershipPlan) => <Text className="font-medium">${p.price}</Text> },
    { key: "duration_days", header: "Duration", cell: (p: MembershipPlan) => <Badge color={p.duration_days <= 30 ? "blue" : "purple"}>{p.duration_days} days</Badge> },
    { key: "benefits", header: "Benefits", cell: (p: MembershipPlan) => `${p.benefits?.length || 0} benefits` },
    { key: "is_active", header: "Status", cell: (p: MembershipPlan) => <StatusBadge status={p.is_active ? "active" : "inactive"} /> },
    { key: "actions", header: "", width: "80px", cell: (p: MembershipPlan) => (
      <Button variant="transparent" size="small" onClick={() => openEdit(p)}><PencilSquare className="w-4 h-4" /></Button>
    )},
  ]

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div><Heading level="h1">Membership Plans</Heading><Text className="text-ui-fg-muted">Manage membership tiers, pricing, and subscribers</Text></div>
          <Button onClick={() => { setEditing(null); setFormData({ name: "", price: "9.99", duration_days: "30", benefits: "" }); setShowDrawer(true) }}><Plus className="w-4 h-4 mr-2" />Create Plan</Button>
        </div>
      </div>
      <div className="p-6"><StatsGrid stats={stats} columns={4} /></div>
      <div className="px-6 pb-6">
        <DataTable data={plans} columns={columns} searchable searchPlaceholder="Search plans..." searchKeys={["name"]} loading={isLoading} emptyMessage="No membership plans found" />
      </div>
      <FormDrawer open={showDrawer} onOpenChange={(open) => { if (!open) { setShowDrawer(false); setEditing(null) } }} title={editing ? "Edit Plan" : "Create Plan"} onSubmit={handleSubmit} submitLabel={editing ? "Update" : "Create"} loading={createPlan.isPending || updatePlan.isPending}>
        <div className="space-y-4">
          <div><Label htmlFor="name">Plan Name</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value as any })} placeholder="Pro Plan" /></div>
          <div><Label htmlFor="price">Price</Label><Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value as any })} /></div>
          <div><Label htmlFor="duration">Duration (days)</Label><Input id="duration" type="number" value={formData.duration_days} onChange={(e) => setFormData({ ...formData, duration_days: e.target.value as any })} /></div>
          <div><Label htmlFor="benefits">Benefits (comma-separated)</Label><Input id="benefits" value={formData.benefits} onChange={(e) => setFormData({ ...formData, benefits: e.target.value as any })} placeholder="Feature 1, Feature 2, ..." /></div>
        </div>
      </FormDrawer>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Memberships", icon: UserGroup })
export default MembershipsPage
