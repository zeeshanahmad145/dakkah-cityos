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

export const Route = createFileRoute("/$tenant/$locale/manage/reviews")({
  component: ManageReviewsPage,
})

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"] as const

function renderStars(rating: number) {
  const stars = Math.min(Math.max(Math.round(rating), 0), 5)
  return (
    <span className="text-ds-warning" title={`${rating}/5`}>
      {"★".repeat(stars)}
      {"☆".repeat(5 - stars)}
    </span>
  )
}

function ManageReviewsPage() {
  const { locale: routeLocale } = Route.useParams()
  const { locale: ctxLocale } = useTenant()
  const locale = routeLocale || ctxLocale || "en"
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const config = crudConfigs["reviews"]
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
    queryKey: ["manage", "reviews"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/reviews", {
        method: "GET",
      })
      return response
    },
    enabled: typeof window !== "undefined",
  })

  const allReviews = ((data as any)?.reviews || []).map((r: any) => ({
    id: r.id,
    product: r.product?.title || r.product_title || "—",
    customer: r.customer?.first_name
      ? `${r.customer.first_name} ${r.customer.last_name || ""}`.trim()
      : r.customer_name || "—",
    rating: r.rating ?? 0,
    status: r.status || "pending",
    date: r.created_at ? new Date(r.created_at!).toLocaleDateString() : "—",
  }))

  const reviews =
    statusFilter === "all"
      ? allReviews
      : allReviews.filter((r: any) => r.status === statusFilter)

  const columns = [
    {
      key: "product",
      header: t(locale, "manage.product"),
      render: (val: unknown) => (
        <span className="font-medium">{val as string}</span>
      ),
    },
    {
      key: "customer",
      header: t(locale, "manage.customer"),
    },
    {
      key: "rating",
      header: t(locale, "manage.rating"),
      render: (val: unknown) => renderStars(val as number),
    },
    {
      key: "status",
      header: t(locale, "manage.status"),
      render: (val: unknown) => (
        <StatusBadge
          status={val as string}
          variants={{
            pending: "bg-ds-warning",
            approved: "bg-ds-success",
            rejected: "bg-ds-destructive",
          }}
        />
      ),
    },
    {
      key: "date",
      header: t(locale, "manage.date"),
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
          subtitle={t(locale, "manage.manage_reviews")}
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
          data={reviews}
          emptyTitle={t(locale, "manage.no_reviews")}
          countLabel={t(locale, "manage.reviews").toLowerCase()}
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
