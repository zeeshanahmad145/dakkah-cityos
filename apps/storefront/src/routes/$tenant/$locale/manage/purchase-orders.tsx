// @ts-nocheck
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
  DropdownMenu,
  FormDrawer,
  ConfirmDialog,
  useToast,
  Tabs,
} from "@/components/manage/ui"
import { t } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useManageCrud } from "@/lib/hooks/use-manage-crud"
import { Plus } from "@medusajs/icons"

export const Route = createFileRoute("/$tenant/$locale/manage/purchase-orders")(
  {
    component: ManagePurchaseOrdersPage,
  },
)

const config = {
  moduleKey: "purchase-orders",
  singularLabel: "Purchase Order",
  pluralLabel: "Purchase Orders",
  label: "Purchase Orders",
  apiEndpoint: "/admin/purchase-orders",
  fields: [
    {
      key: "po_number",
      label: "PO Number",
      type: "text" as const,
      required: true,
      placeholder: "PO-001",
    },
    {
      key: "vendor",
      label: "Vendor",
      type: "text" as const,
      required: true,
      placeholder: "Vendor name",
    },
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "draft", label: "Draft" },
        { value: "submitted", label: "Submitted" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "received", label: "Received" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
    { key: "total", label: "Total", type: "number" as const, placeholder: "0" },
    { key: "created_at", label: "Created At", type: "date" as const },
  ],
  defaultValues: {
    po_number: "",
    vendor: "",
    status: "draft",
    total: 0,
    created_at: "",
  },
}

const STATUS_FILTERS = [
  "all",
  "draft",
  "submitted",
  "approved",
  "rejected",
  "received",
  "cancelled",
] as const

function ManagePurchaseOrdersPage() {
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

  const allItems = ((data as any)?.items || data?.purchase_orders || []).map(
    (item: any) => ({
      id: item.id,
      po_number: item.po_number || "—",
      vendor: item.vendor || item.vendor_name || "—",
      status: item.status || "draft",
      total: item.total != null ? `$${Number(item.total).toFixed(2)}` : "—",
      created_at: item.created_at || "—",
    }),
  )

  const items =
    statusFilter === "all"
      ? allItems
      : allItems.filter((i: any) => i.status === statusFilter)

  const columns = [
    {
      key: "po_number",
      header: "PO Number",
      render: (val: unknown) => (
        <span className="font-medium">{val as string}</span>
      ),
    },
    { key: "vendor", header: "Vendor" },
    { key: "total", header: "Total", align: "end" as const },
    { key: "created_at", header: "Created" },
    {
      key: "status",
      header: t(locale, "manage.status"),
      render: (val: unknown) => <StatusBadge status={val as string} />,
    },
    {
      key: "actions",
      header: t(locale, "manage.actions"),
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
          <SkeletonTable rows={8} cols={6} />
        </Container>
      </ManageLayout>
    )
  }

  return (
    <ManageLayout locale={locale}>
      <Container>
        <PageHeader
          title={config.label}
          subtitle="Manage purchase orders"
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
          data={items}
          emptyTitle="No purchase orders found"
          countLabel="orders"
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
