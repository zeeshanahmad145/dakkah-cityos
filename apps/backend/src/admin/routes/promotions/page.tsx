import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Badge, Input, toast, Label } from "@medusajs/ui"
import { Sparkles, Plus, PencilSquare } from "@medusajs/icons"
import { useState } from "react"
import { useFlashSales, useProductBundles, useCreateFlashSale, useCreateBundle, FlashSale, ProductBundle } from "../../hooks/use-promotions-ext.js"
import { DataTable } from "../../components/tables/data-table.js"
import { StatusBadge } from "../../components/common"
import { StatsGrid } from "../../components/charts/stats-grid.js"
import { FormDrawer } from "../../components/forms/form-drawer.js"

const PromotionsPage = () => {
  const [activeTab, setActiveTab] = useState<"flash" | "bundles">("flash")
  const [showDrawer, setShowDrawer] = useState(false)
  const [formData, setFormData] = useState({ title: "", discount_percentage: "10", start_date: "", end_date: "" })
  const [bundleFormData, setBundleFormData] = useState({ title: "", bundle_price: "0", original_price: "0", discount_percentage: "10" })

  const { data: flashData, isLoading: loadingFlash } = useFlashSales()
  const { data: bundleData, isLoading: loadingBundles } = useProductBundles()
  const createFlashSale = useCreateFlashSale()
  const createBundle = useCreateBundle()

  const flashSales = flashData?.flash_sales || []
  const bundles = bundleData?.bundles || []

  const stats = [
    { label: "Active Flash Sales", value: flashSales.filter(f => f.is_active).length, icon: <Sparkles className="w-5 h-5" />, color: "orange" as const },
    { label: "Active Bundles", value: bundles.filter(b => b.is_active).length, color: "blue" as const },
    { label: "Total Promotions", value: flashSales.length + bundles.length },
    { label: "Flash Sale Uses", value: flashSales.reduce((s, f) => s + f.current_uses, 0), color: "green" as const },
  ]

  const handleSubmitFlash = async () => {
    try {
      await createFlashSale.mutateAsync({ title: formData.title, discount_percentage: Number(formData.discount_percentage), start_date: formData.start_date, end_date: formData.end_date, is_active: true, product_ids: [] })
      toast.success("Flash sale created")
      setShowDrawer(false)
      setFormData({ title: "", discount_percentage: "10", start_date: "", end_date: "" })
    } catch (error) {
      toast.error("Failed to create flash sale")
    }
  }

  const handleSubmitBundle = async () => {
    try {
      await createBundle.mutateAsync({ title: bundleFormData.title, bundle_price: Number(bundleFormData.bundle_price), original_price: Number(bundleFormData.original_price), discount_percentage: Number(bundleFormData.discount_percentage), is_active: true, product_ids: [] })
      toast.success("Bundle created")
      setShowDrawer(false)
      setBundleFormData({ title: "", bundle_price: "0", original_price: "0", discount_percentage: "10" })
    } catch (error) {
      toast.error("Failed to create bundle")
    }
  }

  const flashColumns = [
    { key: "title", header: "Sale Name", sortable: true, cell: (f: FlashSale) => <Text className="font-medium">{f.title}</Text> },
    { key: "discount_percentage", header: "Discount", cell: (f: FlashSale) => <Badge color="orange">{f.discount_percentage}% OFF</Badge> },
    { key: "dates", header: "Dates", cell: (f: FlashSale) => <Text className="text-sm">{f.start_date?.split("T")[0]} — {f.end_date?.split("T")[0]}</Text> },
    { key: "current_uses", header: "Uses", sortable: true, cell: (f: FlashSale) => f.current_uses },
    { key: "is_active", header: "Status", cell: (f: FlashSale) => <StatusBadge status={f.is_active ? "active" : "inactive"} /> },
    { key: "actions", header: "", width: "80px", cell: () => <Button variant="transparent" size="small"><PencilSquare className="w-4 h-4" /></Button> },
  ]

  const bundleColumns = [
    { key: "title", header: "Bundle Name", sortable: true, cell: (b: ProductBundle) => <Text className="font-medium">{b.title}</Text> },
    { key: "discount_percentage", header: "Discount", cell: (b: ProductBundle) => <Badge color="blue">{b.discount_percentage}% OFF</Badge> },
    { key: "product_ids", header: "Products", cell: (b: ProductBundle) => b.product_ids?.length || 0 },
    { key: "bundle_price", header: "Bundle Price", cell: (b: ProductBundle) => <Text className="font-medium">${b.bundle_price}</Text> },
    { key: "is_active", header: "Status", cell: (b: ProductBundle) => <StatusBadge status={b.is_active ? "active" : "inactive"} /> },
    { key: "actions", header: "", width: "80px", cell: () => <Button variant="transparent" size="small"><PencilSquare className="w-4 h-4" /></Button> },
  ]

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div><Heading level="h1">Promotions</Heading><Text className="text-ui-fg-muted">Manage flash sales and product bundles</Text></div>
          <Button onClick={() => setShowDrawer(true)}><Plus className="w-4 h-4 mr-2" />{activeTab === "flash" ? "Create Flash Sale" : "Create Bundle"}</Button>
        </div>
      </div>
      <div className="p-6"><StatsGrid stats={stats} columns={4} /></div>
      <div className="px-6 pb-6">
        <div className="flex gap-4 border-b border-ui-border-base mb-4">
          <button className={`pb-2 px-1 ${activeTab === "flash" ? "border-b-2 border-ui-fg-base font-medium" : "text-ui-fg-muted"}`} onClick={() => setActiveTab("flash")}>
            <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" />Flash Sales ({flashSales.length})</div>
          </button>
          <button className={`pb-2 px-1 ${activeTab === "bundles" ? "border-b-2 border-ui-fg-base font-medium" : "text-ui-fg-muted"}`} onClick={() => setActiveTab("bundles")}>
            Bundles ({bundles.length})
          </button>
        </div>
        {activeTab === "flash" && <DataTable data={flashSales} columns={flashColumns} searchable searchPlaceholder="Search flash sales..." searchKeys={["title"]} loading={loadingFlash} emptyMessage="No flash sales found" />}
        {activeTab === "bundles" && <DataTable data={bundles} columns={bundleColumns} searchable searchPlaceholder="Search bundles..." searchKeys={["title"]} loading={loadingBundles} emptyMessage="No bundles found" />}
      </div>
      <FormDrawer open={showDrawer && activeTab === "flash"} onOpenChange={(open) => { if (!open) setShowDrawer(false) }} title="Create Flash Sale" onSubmit={handleSubmitFlash} submitLabel="Create" loading={createFlashSale.isPending}>
        <div className="space-y-4">
          <div><Label htmlFor="title">Name</Label><Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value as any })} placeholder="Summer Sale" /></div>
          <div><Label htmlFor="discount">Discount %</Label><Input id="discount" type="number" value={formData.discount_percentage} onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value as any })} /></div>
          <div><Label htmlFor="start">Start Date</Label><Input id="start" type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value as any })} /></div>
          <div><Label htmlFor="end">End Date</Label><Input id="end" type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value as any })} /></div>
        </div>
      </FormDrawer>
      <FormDrawer open={showDrawer && activeTab === "bundles"} onOpenChange={(open) => { if (!open) setShowDrawer(false) }} title="Create Bundle" onSubmit={handleSubmitBundle} submitLabel="Create" loading={createBundle.isPending}>
        <div className="space-y-4">
          <div><Label htmlFor="bundle_title">Name</Label><Input id="bundle_title" value={bundleFormData.title} onChange={(e) => setBundleFormData({ ...bundleFormData, title: e.target.value })} placeholder="Starter Kit" /></div>
          <div><Label htmlFor="bundle_price">Bundle Price</Label><Input id="bundle_price" type="number" step="0.01" value={bundleFormData.bundle_price} onChange={(e) => setBundleFormData({ ...bundleFormData, bundle_price: e.target.value })} /></div>
          <div><Label htmlFor="original_price">Original Price</Label><Input id="original_price" type="number" step="0.01" value={bundleFormData.original_price} onChange={(e) => setBundleFormData({ ...bundleFormData, original_price: e.target.value })} /></div>
          <div><Label htmlFor="bundle_discount">Discount %</Label><Input id="bundle_discount" type="number" value={bundleFormData.discount_percentage} onChange={(e) => setBundleFormData({ ...bundleFormData, discount_percentage: e.target.value })} /></div>
        </div>
      </FormDrawer>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Promotions", icon: Sparkles })
export default PromotionsPage
