import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Input, toast, Label } from "@medusajs/ui"
import { Star, Plus, PencilSquare } from "@medusajs/icons"
import { useState } from "react"
import { useLoyaltyPrograms, useCreateLoyaltyProgram, useUpdateLoyaltyProgram, LoyaltyProgram } from "../../hooks/use-loyalty.js"
import { DataTable } from "../../components/tables/data-table.js"
import { StatusBadge } from "../../components/common"
import { StatsGrid } from "../../components/charts/stats-grid.js"
import { FormDrawer } from "../../components/forms/form-drawer.js"

const LoyaltyPage = () => {
  const [showDrawer, setShowDrawer] = useState(false)
  const [editing, setEditing] = useState<LoyaltyProgram | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "", points_per_currency: "1", currency_per_point: "0.01", min_redemption_points: "100" })

  const { data: programsData, isLoading } = useLoyaltyPrograms()
  const createProgram = useCreateLoyaltyProgram()
  const updateProgram = useUpdateLoyaltyProgram()

  const programs = programsData?.programs || []

  const stats = [
    { label: "Total Programs", value: programs.length, icon: <Star className="w-5 h-5" /> },
    { label: "Active Programs", value: programs.filter(p => p.is_active).length, color: "green" as const },
    { label: "With Tiers", value: programs.filter(p => p.tiers && p.tiers.length > 0).length, color: "blue" as const },
    { label: "Inactive", value: programs.filter(p => !p.is_active).length, color: "orange" as const },
  ]

  const handleSubmit = async () => {
    try {
      if (editing) {
        await updateProgram.mutateAsync({ id: editing.id, name: formData.name, description: formData.description, points_per_currency: Number(formData.points_per_currency), currency_per_point: Number(formData.currency_per_point), min_redemption_points: Number(formData.min_redemption_points) })
        toast.success("Program updated")
        setEditing(null)
      } else {
        await createProgram.mutateAsync({ name: formData.name, description: formData.description, points_per_currency: Number(formData.points_per_currency), currency_per_point: Number(formData.currency_per_point), min_redemption_points: Number(formData.min_redemption_points), is_active: true })
        toast.success("Program created")
      }
      setShowDrawer(false)
      setFormData({ name: "", description: "", points_per_currency: "1", currency_per_point: "0.01", min_redemption_points: "100" })
    } catch (error) {
      toast.error(editing ? "Failed to update program" : "Failed to create program")
    }
  }

  const openEdit = (p: LoyaltyProgram) => {
    setFormData({ name: p.name, description: p.description || "", points_per_currency: String(p.points_per_currency), currency_per_point: String(p.currency_per_point), min_redemption_points: String(p.min_redemption_points) })
    setEditing(p)
    setShowDrawer(true)
  }

  const columns = [
    { key: "name", header: "Program", sortable: true, cell: (p: LoyaltyProgram) => (
      <div><Text className="font-medium">{p.name}</Text><Text className="text-ui-fg-muted text-sm">{p.description}</Text></div>
    )},
    { key: "points_per_currency", header: "Pts/Currency", cell: (p: LoyaltyProgram) => `${p.points_per_currency} pts` },
    { key: "tiers", header: "Tiers", cell: (p: LoyaltyProgram) => `${p.tiers?.length || 0} tiers` },
    { key: "is_active", header: "Status", cell: (p: LoyaltyProgram) => <StatusBadge status={p.is_active ? "active" : "inactive"} /> },
    { key: "actions", header: "", width: "80px", cell: (p: LoyaltyProgram) => (
      <Button variant="transparent" size="small" onClick={() => openEdit(p)}><PencilSquare className="w-4 h-4" /></Button>
    )},
  ]

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div><Heading level="h1">Loyalty Programs</Heading><Text className="text-ui-fg-muted">Manage loyalty programs, tiers, and rewards</Text></div>
          <Button onClick={() => { setEditing(null); setFormData({ name: "", description: "", points_per_currency: "1", currency_per_point: "0.01", min_redemption_points: "100" }); setShowDrawer(true) }}><Plus className="w-4 h-4 mr-2" />Create Program</Button>
        </div>
      </div>
      <div className="p-6"><StatsGrid stats={stats} columns={4} /></div>
      <div className="px-6 pb-6">
        <DataTable data={programs} columns={columns} searchable searchPlaceholder="Search programs..." searchKeys={["name"]} loading={isLoading} emptyMessage="No loyalty programs found" />
      </div>
      <FormDrawer open={showDrawer} onOpenChange={(open) => { if (!open) { setShowDrawer(false); setEditing(null) } }} title={editing ? "Edit Program" : "Create Program"} onSubmit={handleSubmit} submitLabel={editing ? "Update" : "Create"} loading={createProgram.isPending || updateProgram.isPending}>
        <div className="space-y-4">
          <div><Label htmlFor="name">Program Name</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value as any })} placeholder="Gold Rewards" /></div>
          <div><Label htmlFor="description">Description</Label><Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value as any })} placeholder="Describe the program" /></div>
          <div><Label htmlFor="points_per_currency">Points per Currency</Label><Input id="points_per_currency" type="number" value={formData.points_per_currency} onChange={(e) => setFormData({ ...formData, points_per_currency: e.target.value as any })} /></div>
          <div><Label htmlFor="currency_per_point">Currency per Point</Label><Input id="currency_per_point" type="number" step="0.01" value={formData.currency_per_point} onChange={(e) => setFormData({ ...formData, currency_per_point: e.target.value as any })} /></div>
          <div><Label htmlFor="min_redemption">Min Redemption Points</Label><Input id="min_redemption" type="number" value={formData.min_redemption_points} onChange={(e) => setFormData({ ...formData, min_redemption_points: e.target.value as any })} /></div>
        </div>
      </FormDrawer>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Loyalty", icon: Star })
export default LoyaltyPage
