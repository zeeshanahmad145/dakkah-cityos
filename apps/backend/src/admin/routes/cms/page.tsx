import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Badge, Input, toast, Label } from "@medusajs/ui"
import { DocumentText, Plus, PencilSquare, SquaresPlus } from "@medusajs/icons"
import { useState } from "react"
import { useCmsPages, useCmsNavigation, useCreateCmsPage, CmsPage as CmsPageType, CmsNavigation } from "../../hooks/use-cms.js"
import { DataTable } from "../../components/tables/data-table.js"
import { StatusBadge } from "../../components/common"
import { StatsGrid } from "../../components/charts/stats-grid.js"
import { FormDrawer } from "../../components/forms/form-drawer.js"

const CmsPageComponent = () => {
  const [activeTab, setActiveTab] = useState<"pages" | "navigation">("pages")
  const [showDrawer, setShowDrawer] = useState(false)
  const [formData, setFormData] = useState<{ title: string; slug: string; status: string }>({ title: "", slug: "", status: "draft" })
  const [navFormData, setNavFormData] = useState({ name: "", handle: "" })

  const { data: pagesData, isLoading: loadingPages } = useCmsPages()
  const { data: navData, isLoading: loadingNav } = useCmsNavigation()
  const createPage = useCreateCmsPage()

  const pages = pagesData?.pages || []
  const navigations = navData?.navigations || []

  const published = pages.filter(p => p.status === "published").length
  const drafts = pages.filter(p => p.status === "draft").length

  const stats = [
    { label: "Total Pages", value: pages.length, icon: <DocumentText className="w-5 h-5" /> },
    { label: "Published", value: published, color: "green" as const },
    { label: "Draft", value: drafts, color: "orange" as const },
    { label: "Navigation Menus", value: navigations.length, icon: <SquaresPlus className="w-5 h-5" />, color: "blue" as const },
  ]

  const handleSubmitPage = async () => {
    try {
      await createPage.mutateAsync({ title: formData.title, slug: formData.slug, status: formData.status as "draft" | "published" | "archived" })
      toast.success("Page saved")
      setShowDrawer(false)
      setFormData({ title: "", slug: "", status: "draft" })
    } catch (error) {
      toast.error("Failed to create page")
    }
  }

  const handleSubmitNav = () => {
    toast.success("Navigation saved")
    setShowDrawer(false)
    setNavFormData({ name: "", handle: "" })
  }

  const pageColumns = [
    { key: "title", header: "Title", sortable: true, cell: (p: CmsPageType) => (
      <div><Text className="font-medium">{p.title}</Text><Text className="text-ui-fg-muted text-sm font-mono">{p.slug}</Text></div>
    )},
    { key: "template", header: "Template", cell: (p: CmsPageType) => p.template || "-" },
    { key: "status", header: "Status", cell: (p: CmsPageType) => <StatusBadge status={p.status} /> },
    { key: "updated_at", header: "Last Modified", sortable: true, cell: (p: CmsPageType) => p.updated_at?.split("T")[0] },
    { key: "actions", header: "", width: "80px", cell: () => <Button variant="transparent" size="small"><PencilSquare className="w-4 h-4" /></Button> },
  ]

  const navColumns = [
    { key: "name", header: "Menu Name", sortable: true, cell: (n: CmsNavigation) => <Text className="font-medium">{n.name}</Text> },
    { key: "handle", header: "Handle", cell: (n: CmsNavigation) => <Badge color="blue">{n.handle}</Badge> },
    { key: "items", header: "Items", sortable: true, cell: (n: CmsNavigation) => n.items?.length || 0 },
    { key: "is_active", header: "Status", cell: (n: CmsNavigation) => <StatusBadge status={n.is_active ? "active" : "inactive"} /> },
    { key: "updated_at", header: "Last Modified", sortable: true, cell: (n: CmsNavigation) => n.updated_at?.split("T")[0] },
    { key: "actions", header: "", width: "80px", cell: () => <Button variant="transparent" size="small"><PencilSquare className="w-4 h-4" /></Button> },
  ]

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div><Heading level="h1">CMS</Heading><Text className="text-ui-fg-muted">Manage pages, content, and navigation menus</Text></div>
          <Button onClick={() => setShowDrawer(true)}><Plus className="w-4 h-4 mr-2" />{activeTab === "pages" ? "New Page" : "New Menu"}</Button>
        </div>
      </div>
      <div className="p-6"><StatsGrid stats={stats} columns={4} /></div>
      <div className="px-6 pb-6">
        <div className="flex gap-4 border-b border-ui-border-base mb-4">
          <button className={`pb-2 px-1 ${activeTab === "pages" ? "border-b-2 border-ui-fg-base font-medium" : "text-ui-fg-muted"}`} onClick={() => setActiveTab("pages")}>
            <div className="flex items-center gap-2"><DocumentText className="w-4 h-4" />Pages ({pages.length})</div>
          </button>
          <button className={`pb-2 px-1 ${activeTab === "navigation" ? "border-b-2 border-ui-fg-base font-medium" : "text-ui-fg-muted"}`} onClick={() => setActiveTab("navigation")}>
            <div className="flex items-center gap-2"><SquaresPlus className="w-4 h-4" />Navigation ({navigations.length})</div>
          </button>
        </div>
        {activeTab === "pages" && <DataTable data={pages} columns={pageColumns} searchable searchPlaceholder="Search pages..." searchKeys={["title", "slug"]} loading={loadingPages} emptyMessage="No pages found" />}
        {activeTab === "navigation" && <DataTable data={navigations} columns={navColumns} searchable searchPlaceholder="Search menus..." searchKeys={["name", "handle"]} loading={loadingNav} emptyMessage="No navigation menus found" />}
      </div>
      <FormDrawer open={showDrawer && activeTab === "pages"} onOpenChange={(open) => { if (!open) setShowDrawer(false) }} title="New Page" onSubmit={handleSubmitPage} submitLabel="Create" loading={createPage.isPending}>
        <div className="space-y-4">
          <div><Label htmlFor="title">Page Title</Label><Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value as any })} placeholder="About Us" /></div>
          <div><Label htmlFor="slug">Slug</Label><Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value as any })} placeholder="/about-us" /></div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select id="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as string })} className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base">
              <option value="draft">Draft</option><option value="published">Published</option>
            </select>
          </div>
        </div>
      </FormDrawer>
      <FormDrawer open={showDrawer && activeTab === "navigation"} onOpenChange={(open) => { if (!open) setShowDrawer(false) }} title="New Navigation Menu" onSubmit={handleSubmitNav} submitLabel="Create">
        <div className="space-y-4">
          <div><Label htmlFor="nav_name">Menu Name</Label><Input id="nav_name" value={navFormData.name} onChange={(e) => setNavFormData({ ...navFormData, name: e.target.value })} placeholder="Main Navigation" /></div>
          <div><Label htmlFor="handle">Handle</Label><Input id="handle" value={navFormData.handle} onChange={(e) => setNavFormData({ ...navFormData, handle: e.target.value })} placeholder="main-nav" /></div>
        </div>
      </FormDrawer>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "CMS", icon: DocumentText })
export default CmsPageComponent
