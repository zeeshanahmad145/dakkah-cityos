import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Badge, Input, toast, Label } from "@medusajs/ui"
import { DocumentText, Plus, PencilSquare, ArrowDownTray } from "@medusajs/icons"
import { useState } from "react"
import { useDigitalAssets, useCreateDigitalAsset, useUpdateDigitalAsset, DigitalAsset } from "../../hooks/use-digital-products.js"
import { DataTable } from "../../components/tables/data-table.js"
import { StatusBadge } from "../../components/common"
import { StatsGrid } from "../../components/charts/stats-grid.js"
import { FormDrawer } from "../../components/forms/form-drawer.js"

const DigitalProductsPage = () => {
  const [showDrawer, setShowDrawer] = useState(false)
  const [editing, setEditing] = useState<DigitalAsset | null>(null)
  const [formData, setFormData] = useState({ title: "", file_type: "software", file_name: "", file_url: "" })

  const { data: assetsData, isLoading } = useDigitalAssets()
  const createAsset = useCreateDigitalAsset()
  const updateAsset = useUpdateDigitalAsset()

  const assets = assetsData?.assets || []

  const totalDownloads = assets.reduce((s, a) => s + a.download_count, 0)

  const stats = [
    { label: "Total Digital Products", value: assets.length, icon: <DocumentText className="w-5 h-5" /> },
    { label: "Total Downloads", value: totalDownloads.toLocaleString(), color: "blue" as const },
    { label: "Active Assets", value: assets.filter(a => a.is_active).length, color: "green" as const },
    { label: "File Types", value: [...new Set(assets.map(a => a.file_type))].length, color: "purple" as const },
  ]

  const handleSubmit = async () => {
    try {
      if (editing) {
        await updateAsset.mutateAsync({ id: editing.id, title: formData.title, file_type: formData.file_type, file_name: formData.file_name, file_url: formData.file_url })
        toast.success("Product updated")
        setEditing(null)
      } else {
        await createAsset.mutateAsync({ title: formData.title, file_type: formData.file_type, file_name: formData.file_name, file_url: formData.file_url, is_active: true })
        toast.success("Product created")
      }
      setShowDrawer(false)
      setFormData({ title: "", file_type: "software", file_name: "", file_url: "" })
    } catch (error) {
      toast.error(editing ? "Failed to update product" : "Failed to create product")
    }
  }

  const openEdit = (a: DigitalAsset) => {
    setFormData({ title: a.title, file_type: a.file_type, file_name: a.file_name, file_url: a.file_url })
    setEditing(a)
    setShowDrawer(true)
  }

  const getTypeColor = (type: string) => {
    switch (type) { case "software": return "blue"; case "design": return "purple"; case "media": return "orange"; case "document": return "grey"; case "course": return "green"; default: return "grey" }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${bytes} B`
  }

  const columns = [
    { key: "title", header: "Product", sortable: true, cell: (a: DigitalAsset) => (
      <div><Text className="font-medium">{a.title}</Text><Text className="text-ui-fg-muted text-sm">{formatFileSize(a.file_size)}</Text></div>
    )},
    { key: "file_type", header: "Type", cell: (a: DigitalAsset) => <Badge color={getTypeColor(a.file_type)}>{a.file_type}</Badge> },
    { key: "download_count", header: "Downloads", sortable: true, cell: (a: DigitalAsset) => (
      <div className="flex items-center gap-1"><ArrowDownTray className="w-3 h-3 text-ui-fg-muted" /><Text>{a.download_count.toLocaleString()}</Text></div>
    )},
    { key: "version", header: "Version", cell: (a: DigitalAsset) => a.version || "-" },
    { key: "is_active", header: "Status", cell: (a: DigitalAsset) => <StatusBadge status={a.is_active ? "active" : "inactive"} /> },
    { key: "actions", header: "", width: "80px", cell: (a: DigitalAsset) => (
      <Button variant="transparent" size="small" onClick={() => openEdit(a)}><PencilSquare className="w-4 h-4" /></Button>
    )},
  ]

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div><Heading level="h1">Digital Products</Heading><Text className="text-ui-fg-muted">Manage digital assets, downloads, and licenses</Text></div>
          <Button onClick={() => { setEditing(null); setFormData({ title: "", file_type: "software", file_name: "", file_url: "" }); setShowDrawer(true) }}><Plus className="w-4 h-4 mr-2" />Add Product</Button>
        </div>
      </div>
      <div className="p-6"><StatsGrid stats={stats} columns={4} /></div>
      <div className="px-6 pb-6">
        <DataTable data={assets} columns={columns} searchable searchPlaceholder="Search digital products..." searchKeys={["title", "file_type"]} loading={isLoading} emptyMessage="No digital products found" />
      </div>
      <FormDrawer open={showDrawer} onOpenChange={(open) => { if (!open) { setShowDrawer(false); setEditing(null) } }} title={editing ? "Edit Product" : "Add Digital Product"} onSubmit={handleSubmit} submitLabel={editing ? "Update" : "Create"} loading={createAsset.isPending || updateAsset.isPending}>
        <div className="space-y-4">
          <div><Label htmlFor="title">Product Name</Label><Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value as any })} placeholder="My Digital Product" /></div>
          <div>
            <Label htmlFor="file_type">Type</Label>
            <select id="file_type" value={formData.file_type} onChange={(e) => setFormData({ ...formData, file_type: e.target.value as any })} className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base">
              <option value="software">Software</option><option value="design">Design Asset</option><option value="media">Media</option><option value="document">Document</option><option value="course">Course</option>
            </select>
          </div>
          <div><Label htmlFor="file_name">File Name</Label><Input id="file_name" value={formData.file_name} onChange={(e) => setFormData({ ...formData, file_name: e.target.value as any })} placeholder="product.zip" /></div>
          <div><Label htmlFor="file_url">File URL</Label><Input id="file_url" value={formData.file_url} onChange={(e) => setFormData({ ...formData, file_url: e.target.value as any })} placeholder="https://..." /></div>
        </div>
      </FormDrawer>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Digital Products", icon: DocumentText })
export default DigitalProductsPage
