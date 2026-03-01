import { createFileRoute } from "@tanstack/react-router"
import { useState, useCallback } from "react"
import { ManageLayout } from "@/components/manage"
import {
  Container,
  PageHeader,
  DataTable,
  StatusBadge,
  SkeletonTable,
  Button,
  Tabs,
  DropdownMenu,
  FormDrawer,
  ConfirmDialog,
  useToast,
} from "@/components/manage/ui"
import { t } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useManageCrud } from "@/lib/hooks/use-manage-crud"
import { crudConfigs } from "@/components/manage/crud-configs"
import { Plus } from "@medusajs/icons"

const config = crudConfigs["vendors"]

export const Route = createFileRoute("/$tenant/$locale/manage/vendors")({
  component: ManageVendorsPage,
})

const STATUS_FILTERS = ["all", "pending", "approved", "suspended"] as const

function ManageVendorsPage() {
  const { locale: routeLocale } = Route.useParams()
  const { locale: ctxLocale } = useTenant()
  const locale = routeLocale || ctxLocale || "en"
  const { addToast } = useToast()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formValues, setFormValues] = useState<Record<string, any>>(
    config.defaultValues,
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const { data, isLoading } = useQuery({
    queryKey: ["manage", config.moduleKey],
    queryFn: async () => {
      const response = await sdk.client.fetch(config.apiEndpoint, {
        method: "GET",
      })
      return response
    },
    enabled: typeof window !== "undefined",
  })

  const { createMutation, updateMutation, deleteMutation } = useManageCrud({
    moduleKey: config.moduleKey,
    apiEndpoint: config.apiEndpoint,
  })

  const handleCreate = useCallback(() => {
    setEditingItem(null)
    setFormValues({ ...config.defaultValues })
    setDrawerOpen(true)
  }, [])

  const handleEdit = useCallback((row: any) => {
    setEditingItem(row)
    const values: Record<string, any> = {}
    config.fields.forEach((f) => {
      values[f.key] = row[f.key] ?? config.defaultValues[f.key] ?? ""
    })
    setFormValues(values)
    setDrawerOpen(true)
  }, [])

  const handleFormChange = useCallback((key: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSubmit = useCallback(async () => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, ...formValues })
        addToast("success", `${config.singularLabel} updated successfully`)
      } else {
        await createMutation.mutateAsync(formValues)
        addToast("success", `${config.singularLabel} created successfully`)
      }
      setDrawerOpen(false)
      setEditingItem(null)
    } catch (e) {
      addToast("error", `Failed to save ${config.singularLabel.toLowerCase()}`)
    }
  }, [editingItem, formValues, updateMutation, createMutation, addToast])

  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      addToast("success", `${config.singularLabel} deleted successfully`)
      setDeleteId(null)
    } catch (e) {
      addToast(
        "error",
        `Failed to delete ${config.singularLabel.toLowerCase()}`,
      )
    }
  }, [deleteId, deleteMutation, addToast])

  const allVendors = ((data as any)?.vendors || []).map((v: any) => ({
    id: v.id,
    company_name: v.company_name || "",
    name: v.company_name || v.name || "—",
    email: v.email || "",
    contact: v.email || "—",
    phone: v.phone || "",
    description: v.description || "",
    status: v.status || "pending",
    products_count: v.products_count ?? 0,
    rating: v.rating ? Number(v.rating).toFixed(1) : "—",
    joined: v.created_at ? new Date(v.created_at!).toLocaleDateString() : "—",
  }))

  const vendors =
    statusFilter === "all"
      ? allVendors
      : allVendors.filter((v: any) => v.status === statusFilter)

  const columns = [
    {
      key: "name",
      header: t(locale, "manage.name"),
      render: (val: unknown) => (
        <span className="font-medium">{val as string}</span>
      ),
    },
    {
      key: "contact",
      header: t(locale, "manage.contact"),
    },
    {
      key: "status",
      header: t(locale, "manage.status"),
      render: (val: unknown) => <StatusBadge status={val as string} />,
    },
    {
      key: "products_count",
      header: t(locale, "manage.products"),
      align: "end" as const,
    },
    {
      key: "rating",
      header: t(locale, "manage.rating"),
      align: "end" as const,
    },
    {
      key: "joined",
      header: t(locale, "manage.joined"),
    },
    {
      key: "actions",
      header: t(locale, "manage.actions"),
      align: "end" as const,
      render: (_: unknown, row: any) => (
        <DropdownMenu
          items={[
            { label: t(locale, "manage.edit"), onClick: () => handleEdit(row) },
            { type: "separator" as const },
            {
              label: t(locale, "manage.delete"),
              onClick: () => setDeleteId(row.id),
              variant: "danger" as const,
            },
          ]}
        />
      ),
    },
  ]

  if (isLoading) {
    return (
      <ManageLayout locale={locale}>
        <Container>
          <SkeletonTable rows={8} cols={7} />
        </Container>
      </ManageLayout>
    )
  }

  return (
    <ManageLayout locale={locale}>
      <Container>
        <PageHeader
          title={t(locale, "manage.vendors")}
          subtitle={t(locale, "manage.vendors_subtitle")}
          actions={
            <Button variant="primary" size="base" onClick={handleCreate}>
              <Plus className="w-4 h-4" />
              Add Vendor
            </Button>
          }
        />

        <Tabs
          tabs={STATUS_FILTERS.map((s) => ({
            id: s,
            label:
              s === "all"
                ? t(locale, "manage.all_statuses")
                : s.replace(/_/g, " "),
          }))}
          activeTab={statusFilter}
          onTabChange={setStatusFilter}
          className="mb-4"
        />

        <DataTable
          columns={columns}
          data={vendors}
          searchable
          searchKey="name"
          searchPlaceholder={t(locale, "manage.search_vendors")}
          emptyTitle={t(locale, "manage.no_vendors")}
          countLabel={t(locale, "manage.vendors").toLowerCase()}
        />
      </Container>

      <FormDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setEditingItem(null)
        }}
        title={
          editingItem
            ? `Edit ${config.singularLabel}`
            : `Add ${config.singularLabel}`
        }
        fields={config.fields}
        values={formValues}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        submitLabel={
          editingItem
            ? t(locale, "common.actions.update", "Update")
            : t(locale, "common.actions.create", "Create")
        }
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={`Delete ${config.singularLabel}`}
        description={`Are you sure you want to delete this ${config.singularLabel.toLowerCase()}? This action cannot be undone.`}
        loading={deleteMutation.isPending}
      />
    </ManageLayout>
  )
}
