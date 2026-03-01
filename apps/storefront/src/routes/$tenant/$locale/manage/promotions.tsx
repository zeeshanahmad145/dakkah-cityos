import { createFileRoute } from "@tanstack/react-router"
import { useState, useCallback } from "react"
import { ManageLayout } from "@/components/manage"
import {
  Container,
  PageHeader,
  DataTable,
  StatusBadge,
  SkeletonTable,
  Tabs,
  Button,
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

export const Route = createFileRoute("/$tenant/$locale/manage/promotions")({
  component: ManagePromotionsPage,
})

const config = crudConfigs["promotions"]
const STATUS_FILTERS = ["all", "active", "expired", "draft"] as const

function ManagePromotionsPage() {
  const { locale: routeLocale } = Route.useParams()
  const { locale: ctxLocale } = useTenant()
  const locale = routeLocale || ctxLocale || "en"
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const { addToast } = useToast()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formValues, setFormValues] = useState<Record<string, any>>(
    config.defaultValues,
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)

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

  const { data, isLoading } = useQuery({
    queryKey: ["manage", "promotions"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/promotions", {
        method: "GET",
      })
      return response
    },
    enabled: typeof window !== "undefined",
  })

  const allPromotions = ((data as any)?.promotions || []).map((item: any) => ({
    id: item.id,
    name: item.name || item.title || "—",
    code: item.code || "—",
    type: item.type || "percentage",
    discount_value: item.discount_value ?? item.value ?? "—",
    usage_count: item.usage_count ?? 0,
    usage_limit: item.usage_limit ?? "—",
    status: item.status || "draft",
    valid_until: item.valid_until
      ? new Date(item.valid_until!).toLocaleDateString()
      : "—",
  }))

  const promotions =
    statusFilter === "all"
      ? allPromotions
      : allPromotions.filter((i: any) => i.status === statusFilter)

  const columns = [
    {
      key: "name",
      header: t(locale, "manage.name"),
      render: (val: unknown) => (
        <span className="font-medium">{val as string}</span>
      ),
    },
    {
      key: "code",
      header: t(locale, "manage.code"),
    },
    {
      key: "type",
      header: t(locale, "manage.type"),
    },
    {
      key: "discount_value",
      header: t(locale, "manage.discount_value"),
      align: "end" as const,
    },
    {
      key: "usage_count",
      header: t(locale, "manage.usage_count"),
      align: "end" as const,
    },
    {
      key: "usage_limit",
      header: t(locale, "manage.usage_limit"),
      align: "end" as const,
    },
    {
      key: "status",
      header: t(locale, "manage.status"),
      render: (val: unknown) => <StatusBadge status={val as string} />,
    },
    {
      key: "valid_until",
      header: t(locale, "manage.valid_until"),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      render: (_: unknown, row: any) => (
        <DropdownMenu
          items={[
            {
              label: t(locale, "common.actions.edit", "Edit"),
              onClick: () => handleEdit(row),
            },
            { type: "separator" as const },
            {
              label: t(locale, "common.actions.delete", "Delete"),
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
          <SkeletonTable rows={8} cols={9} />
        </Container>
      </ManageLayout>
    )
  }

  return (
    <ManageLayout locale={locale}>
      <Container>
        <PageHeader
          title={config.label}
          subtitle="Manage promotions and discount codes"
          actions={
            <Button variant="primary" size="base" onClick={handleCreate}>
              <Plus className="w-4 h-4" />
              Add {config.singularLabel}
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
          data={promotions}
          emptyTitle="No promotions found"
          countLabel="promotions"
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
            : `Create ${config.singularLabel}`
        }
        fields={config.fields}
        values={formValues}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        submitLabel={
          editingItem
            ? t(locale, "common.actions.saveChanges", "Save changes")
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
