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

export const Route = createFileRoute("/$tenant/$locale/manage/affiliates")({
  component: ManageAffiliatesPage,
})

const STATUS_FILTERS = ["all", "active", "inactive"] as const

function ManageAffiliatesPage() {
  const { locale: routeLocale } = Route.useParams()
  const { locale: ctxLocale } = useTenant()
  const locale = routeLocale || ctxLocale || "en"
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const config = crudConfigs["affiliates"]
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
    queryKey: ["manage", "affiliates"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/affiliates", {
        method: "GET",
      })
      return response
    },
    enabled: typeof window !== "undefined",
  })

  const allAffiliates = ((data as any)?.affiliates || []).map((a: any) => ({
    id: a.id,
    name:
      a.name || a.first_name
        ? `${a.first_name || ""} ${a.last_name || ""}`.trim()
        : "—",
    code: a.code || a.referral_code || "—",
    clicks: a.clicks ?? 0,
    conversions: a.conversions ?? 0,
    earnings: a.earnings ? `$${(a.earnings / 100).toFixed(2)}` : "$0.00",
    status: a.status || "active",
  }))

  const affiliates =
    statusFilter === "all"
      ? allAffiliates
      : allAffiliates.filter((a: any) => a.status === statusFilter)

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
      render: (val: unknown) => (
        <span className="font-mono text-xs">{val as string}</span>
      ),
    },
    {
      key: "clicks",
      header: t(locale, "manage.clicks"),
      align: "end" as const,
    },
    {
      key: "conversions",
      header: t(locale, "manage.conversions"),
      align: "end" as const,
    },
    {
      key: "earnings",
      header: t(locale, "manage.earnings"),
      align: "end" as const,
    },
    {
      key: "status",
      header: t(locale, "manage.status"),
      render: (val: unknown) => <StatusBadge status={val as string} />,
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
          <SkeletonTable rows={8} cols={7} />
        </Container>
      </ManageLayout>
    )
  }

  return (
    <ManageLayout locale={locale}>
      <Container>
        <PageHeader
          title={config.label}
          subtitle={t(locale, "manage.affiliates_subtitle")}
          actions={
            config.canCreate !== false ? (
              <Button variant="primary" size="base" onClick={handleCreate}>
                <Plus className="w-4 h-4" />
                Add {config.singularLabel}
              </Button>
            ) : undefined
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
          data={affiliates}
          emptyTitle={t(locale, "manage.no_affiliates")}
          countLabel={t(locale, "manage.affiliates").toLowerCase()}
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
