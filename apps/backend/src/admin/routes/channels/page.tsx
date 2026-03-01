import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Badge, Input, toast, Label } from "@medusajs/ui"
import { Channels as ChannelsIcon, Plus, PencilSquare, Trash } from "@medusajs/icons"
import { useState } from "react"
import { useChannels, useCreateChannel, useUpdateChannel, useDeleteChannel, Channel } from "../../hooks/use-channels.js"
import { DataTable } from "../../components/tables/data-table.js"
import { StatusBadge } from "../../components/common"
import { StatsGrid } from "../../components/charts/stats-grid.js"
import { FormDrawer } from "../../components/forms/form-drawer.js"
import { ConfirmModal } from "../../components/modals/confirm-modal.js"

const CHANNEL_TYPES = ["web", "mobile", "pos", "api", "kiosk", "social"] as const

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case "web": return "blue"
    case "mobile": return "green"
    case "pos": return "orange"
    case "api": return "purple"
    case "kiosk": return "grey"
    case "social": return "red"
    default: return "grey"
  }
}

const ChannelsPage = () => {
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [deletingChannel, setDeletingChannel] = useState<Channel | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    type: "web" as Channel["type"],
    tenant_id: "",
    description: "",
    configuration: "",
  })

  const { data: channelsData, isLoading } = useChannels()
  const createChannel = useCreateChannel()
  const updateChannel = useUpdateChannel()
  const deleteChannel = useDeleteChannel()

  const channels = channelsData?.channels || []

  const stats = [
    { label: "Total Channels", value: channels.length, icon: <ChannelsIcon className="w-5 h-5" /> },
    { label: "Active", value: channels.filter(c => c.status === "active").length, color: "green" as const },
    { label: "Web", value: channels.filter(c => c.type === "web").length, color: "blue" as const },
    { label: "Mobile", value: channels.filter(c => c.type === "mobile").length, color: "orange" as const },
  ]

  const handleCreate = async () => {
    try {
      let configuration: Record<string, unknown> | undefined
      if (formData.configuration) {
        try { configuration = JSON.parse(formData.configuration) } catch { toast.error("Invalid JSON for configuration"); return }
      }
      await createChannel.mutateAsync({ ...formData, configuration })
      toast.success("Channel created successfully")
      setShowCreateDrawer(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to create channel")
    }
  }

  const handleUpdate = async () => {
    if (!editingChannel) return
    try {
      let configuration: Record<string, unknown> | undefined
      if (formData.configuration) {
        try { configuration = JSON.parse(formData.configuration) } catch { toast.error("Invalid JSON for configuration"); return }
      }
      await updateChannel.mutateAsync({ id: editingChannel.id, ...formData, configuration })
      toast.success("Channel updated successfully")
      setEditingChannel(null)
      resetForm()
    } catch (error) {
      toast.error("Failed to update channel")
    }
  }

  const handleDelete = async () => {
    if (!deletingChannel) return
    try {
      await deleteChannel.mutateAsync(deletingChannel.id)
      toast.success("Channel deleted")
      setDeletingChannel(null)
    } catch (error) {
      toast.error("Failed to delete channel")
    }
  }

  const resetForm = () => {
    setFormData({ name: "", type: "web", tenant_id: "", description: "", configuration: "" })
  }

  const openEditDrawer = (channel: Channel) => {
    setFormData({
      name: channel.name,
      type: channel.type,
      tenant_id: channel.tenant_id || "",
      description: channel.description || "",
      configuration: channel.configuration ? JSON.stringify(channel.configuration, null, 2) : "",
    })
    setEditingChannel(channel)
  }

  const columns = [
    { key: "name", header: "Channel", sortable: true, cell: (c: Channel) => (
      <div><Text className="font-medium">{c.name}</Text>{c.description && <Text className="text-ui-fg-muted text-sm">{c.description}</Text>}</div>
    )},
    { key: "type", header: "Type", cell: (c: Channel) => <Badge color={getTypeBadgeColor(c.type)}>{c.type.toUpperCase()}</Badge> },
    { key: "status", header: "Status", cell: (c: Channel) => <StatusBadge status={c.status} /> },
    { key: "tenant_id", header: "Tenant", cell: (c: Channel) => <Text>{c.tenant_name || c.tenant_id || "-"}</Text> },
    { key: "created_at", header: "Created", sortable: true, cell: (c: Channel) => new Date(c.created_at).toLocaleDateString() },
    { key: "actions", header: "", width: "100px", cell: (c: Channel) => (
      <div className="flex gap-1">
        <Button variant="transparent" size="small" onClick={() => openEditDrawer(c)}><PencilSquare className="w-4 h-4" /></Button>
        <Button variant="transparent" size="small" onClick={() => setDeletingChannel(c)}><Trash className="w-4 h-4 text-ui-tag-red-icon" /></Button>
      </div>
    )},
  ]

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div><Heading level="h1">Service Channels</Heading><Text className="text-ui-fg-muted">Manage service channels: web, mobile, POS, API, kiosk, social</Text></div>
          <Button onClick={() => setShowCreateDrawer(true)}><Plus className="w-4 h-4 mr-2" />Add Channel</Button>
        </div>
      </div>

      <div className="p-6"><StatsGrid stats={stats} columns={4} /></div>

      <div className="px-6 pb-6">
        <DataTable data={channels} columns={columns} searchable searchPlaceholder="Search channels..." searchKeys={["name", "type", "description"]} loading={isLoading} emptyMessage="No channels found" />
      </div>

      <FormDrawer
        open={showCreateDrawer || !!editingChannel}
        onOpenChange={(open) => { if (!open) { setShowCreateDrawer(false); setEditingChannel(null); resetForm() } }}
        title={editingChannel ? "Edit Channel" : "Create Channel"}
        onSubmit={editingChannel ? handleUpdate : handleCreate}
        submitLabel={editingChannel ? "Update" : "Create"}
        loading={createChannel.isPending || updateChannel.isPending}
      >
        <div className="space-y-4">
          <div><Label htmlFor="name">Channel Name</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value as any })} placeholder="Channel name" /></div>
          <div>
            <Label htmlFor="type">Type</Label>
            <select id="type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as Channel["type"] })} className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base">
              {CHANNEL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div><Label htmlFor="tenant_id">Tenant ID</Label><Input id="tenant_id" value={formData.tenant_id} onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value as any })} placeholder="Tenant ID" /></div>
          <div><Label htmlFor="description">Description</Label><Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value as any })} placeholder="Description" /></div>
          <div>
            <Label htmlFor="configuration">Configuration (JSON)</Label>
            <textarea id="configuration" value={formData.configuration} onChange={(e) => setFormData({ ...formData, configuration: e.target.value as any })} placeholder='{"theme": "dark", "features": []}' className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base min-h-[100px] font-mono text-sm" />
          </div>
        </div>
      </FormDrawer>

      <ConfirmModal open={!!deletingChannel} onOpenChange={() => setDeletingChannel(null)} title="Delete Channel" description={`Delete "${deletingChannel?.name}"? This action cannot be undone.`} onConfirm={handleDelete} confirmLabel="Delete" variant="danger" loading={deleteChannel.isPending} />
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Channels", icon: ChannelsIcon })
export default ChannelsPage
