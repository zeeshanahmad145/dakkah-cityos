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
  useToast,
} from "@/components/manage/ui"
import { t } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useManageCrud } from "@/lib/hooks/use-manage-crud"
import { crudConfigs } from "@/components/manage/crud-configs"

const config = crudConfigs["payouts"]

export const Route = createFileRoute("/$tenant/$locale/manage/payouts")({
  component: ManagePayoutsPage,
})

const STATUS_FILTERS = [
  "all",
  "pending",
  "processing",
  "completed",
  "failed",
  "on_hold",
] as const

function ManagePayoutsPage() {
  const { locale: routeLocale } = Route.useParams()
  const { locale: ctxLocale } = useTenant()
  const locale = routeLocale || ctxLocale || "en"
  const { addToast } = useToast()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formValues, setFormValues] = useState<Record<string, any>>(
    config.defaultValues,
  )
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

  const { updateMutation } = useManageCrud({
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
      }
      setDrawerOpen(false)
      setEditingItem(null)
    } catch (e) {
      addToast("error", `Failed to save ${config.singularLabel.toLowerCase()}`)
    }
  }, [editingItem, formValues, updateMutation, addToast])

  const allPayouts = ((data as any)?.payouts || []).map((p: any) => ({
    id: p.id,
    vendor: p.vendor?.company_name || p.vendor_name || "—",
    amount: p.amount ? `$${(p.amount / 100).toFixed(2)}` : "$0.00",
    status: p.status || "pending",
    notes: p.notes || "",
    method: p.method || p.payout_method || "—",
    date: p.created_at ? new Date(p.created_at!).toLocaleDateString() : "—",
  }))

  const payouts =
    statusFilter === "all"
      ? allPayouts
      : allPayouts.filter((p: any) => p.status === statusFilter)

  const columns = [
    {
      key: "vendor",
      header: t(locale, "manage.vendor"),
      render: (val: unknown) => (
        <span className="font-medium">{val as string}</span>
      ),
    },
    {
      key: "amount",
      header: t(locale, "manage.amount"),
      align: "end" as const,
    },
    {
      key: "status",
      header: t(locale, "manage.status"),
      render: (val: unknown) => <StatusBadge status={val as string} />,
    },
    {
      key: "method",
      header: t(locale, "manage.method"),
    },
    {
      key: "date",
      header: t(locale, "manage.date"),
    },
    {
      key: "actions",
      header: t(locale, "manage.actions"),
      align: "end" as const,
      render: (_: unknown, row: any) => (
        <DropdownMenu
          items={[
            { label: t(locale, "manage.edit"), onClick: () => handleEdit(row) },
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
          title={t(locale, "manage.payouts")}
          subtitle={t(locale, "manage.payouts_subtitle")}
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
          data={payouts}
          emptyTitle={t(locale, "manage.no_payouts")}
          countLabel={t(locale, "manage.payouts").toLowerCase()}
        />
      </Container>

      <FormDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setEditingItem(null)
        }}
        title={`Edit ${config.singularLabel}`}
        fields={config.fields}
        values={formValues}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        loading={updateMutation.isPending}
        submitLabel={t(locale, "common.actions.update", "Update")}
      />
    </ManageLayout>
  )
}
