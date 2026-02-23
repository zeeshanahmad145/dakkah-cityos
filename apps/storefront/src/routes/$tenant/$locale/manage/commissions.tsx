// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useState, useCallback } from "react"
import { ManageLayout } from "@/components/manage"
import { Container, PageHeader, DataTable, StatusBadge, SkeletonTable, Button, Tabs, DropdownMenu, FormDrawer, ConfirmDialog, useToast } from "@/components/manage/ui"
import { t } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useManageCrud } from "@/lib/hooks/use-manage-crud"
import { crudConfigs } from "@/components/manage/crud-configs"
import { Plus } from "@medusajs/icons"

const config = crudConfigs["commissions"]

export const Route = createFileRoute("/$tenant/$locale/manage/commissions")({
  component: ManageCommissionsPage,
})

const COMMISSION_STATUS_FILTERS = ["all", "pending", "calculated", "paid"] as const
const RULES_STATUS_FILTERS = ["all", "active", "inactive"] as const

const rulesConfig = {
  moduleKey: "commission-rules",
  singularLabel: "Commission Rule",
  pluralLabel: "Commission Rules",
  label: "Commission Rules",
  apiEndpoint: "/admin/commission-rules",
  fields: [
    { key: "name", label: "Name", type: "text" as const, required: true, placeholder: "Rule name" },
    { key: "vendor_type", label: "Vendor Type", type: "select" as const, options: [
      { value: "all", label: "All Vendors" },
      { value: "standard", label: "Standard" },
      { value: "premium", label: "Premium" },
      { value: "enterprise", label: "Enterprise" },
    ]},
    { key: "rate", label: "Rate (%)", type: "number" as const, required: true, placeholder: "0" },
    { key: "min_amount", label: "Min Amount", type: "number" as const, placeholder: "0" },
    { key: "max_amount", label: "Max Amount", type: "number" as const, placeholder: "0" },
    { key: "status", label: "Status", type: "select" as const, options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ]},
  ],
  defaultValues: { name: "", vendor_type: "all", rate: 0, min_amount: 0, max_amount: 0, status: "active" },
}

const PAGE_TABS = [
  { id: "commissions", label: "Commissions" },
  { id: "rules", label: "Commission Rules" },
] as const

function ManageCommissionsPage() {
  const { locale: routeLocale } = Route.useParams()
  const { locale: ctxLocale } = useTenant()
  const locale = routeLocale || ctxLocale || "en"
  const { addToast } = useToast()

  const [activePageTab, setActivePageTab] = useState<string>("commissions")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formValues, setFormValues] = useState<Record<string, any>>(config.defaultValues)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [rulesDrawerOpen, setRulesDrawerOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)
  const [rulesFormValues, setRulesFormValues] = useState<Record<string, any>>(rulesConfig.defaultValues)
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null)
  const [rulesStatusFilter, setRulesStatusFilter] = useState<string>("all")

  const { data, isLoading } = useQuery({
    queryKey: ["manage", config.moduleKey],
    queryFn: async () => {
      const response = await sdk.client.fetch(config.apiEndpoint, { method: "GET" })
      return response
    },
    enabled: typeof window !== "undefined",
  })

  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ["manage", rulesConfig.moduleKey],
    queryFn: async () => {
      const response = await sdk.client.fetch(rulesConfig.apiEndpoint, { method: "GET" })
      return response
    },
    enabled: typeof window !== "undefined",
  })

  const { createMutation, updateMutation, deleteMutation } = useManageCrud({
    moduleKey: config.moduleKey,
    apiEndpoint: config.apiEndpoint,
  })

  const { createMutation: createRuleMutation, updateMutation: updateRuleMutation, deleteMutation: deleteRuleMutation } = useManageCrud({
    moduleKey: rulesConfig.moduleKey,
    apiEndpoint: rulesConfig.apiEndpoint,
  })

  const handleCreate = useCallback(() => {
    setEditingItem(null)
    setFormValues({ ...config.defaultValues })
    setDrawerOpen(true)
  }, [])

  const handleEdit = useCallback((row: any) => {
    setEditingItem(row)
    const values: Record<string, any> = {}
    config.fields.forEach((f) => { values[f.key] = row[f.key] ?? config.defaultValues[f.key] ?? "" })
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
      addToast("error", `Failed to delete ${config.singularLabel.toLowerCase()}`)
    }
  }, [deleteId, deleteMutation, addToast])

  const handleCreateRule = useCallback(() => {
    setEditingRule(null)
    setRulesFormValues({ ...rulesConfig.defaultValues })
    setRulesDrawerOpen(true)
  }, [])

  const handleEditRule = useCallback((row: any) => {
    setEditingRule(row)
    const values: Record<string, any> = {}
    rulesConfig.fields.forEach((f) => { values[f.key] = row[f.key] ?? rulesConfig.defaultValues[f.key] ?? "" })
    setRulesFormValues(values)
    setRulesDrawerOpen(true)
  }, [])

  const handleRulesFormChange = useCallback((key: string, value: any) => {
    setRulesFormValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleRulesSubmit = useCallback(async () => {
    try {
      if (editingRule) {
        await updateRuleMutation.mutateAsync({ id: editingRule.id, ...rulesFormValues })
        addToast("success", `${rulesConfig.singularLabel} updated successfully`)
      } else {
        await createRuleMutation.mutateAsync(rulesFormValues)
        addToast("success", `${rulesConfig.singularLabel} created successfully`)
      }
      setRulesDrawerOpen(false)
      setEditingRule(null)
    } catch (e) {
      addToast("error", `Failed to save ${rulesConfig.singularLabel.toLowerCase()}`)
    }
  }, [editingRule, rulesFormValues, updateRuleMutation, createRuleMutation, addToast])

  const handleDeleteRule = useCallback(async () => {
    if (!deleteRuleId) return
    try {
      await deleteRuleMutation.mutateAsync(deleteRuleId)
      addToast("success", `${rulesConfig.singularLabel} deleted successfully`)
      setDeleteRuleId(null)
    } catch (e) {
      addToast("error", `Failed to delete ${rulesConfig.singularLabel.toLowerCase()}`)
    }
  }, [deleteRuleId, deleteRuleMutation, addToast])

  const allCommissions = ((data as any)?.transactions || []).map((c: any) => ({
    id: c.id,
    vendor_id: c.vendor_id || "",
    vendor: c.vendor?.company_name || c.vendor_name || "—",
    order_id: c.order_id ? `#${c.order_id}`.slice(0, 12) : "—",
    amount: c.amount ? `$${(c.amount / 100).toFixed(2)}` : "$0.00",
    rate: c.commission_rate || c.rate || 0,
    commission_rate: c.commission_rate ? `${c.commission_rate}%` : "—",
    commission_amount: c.commission_amount ? `$${(c.commission_amount / 100).toFixed(2)}` : "$0.00",
    type: c.type || "percentage",
    status: c.status || "pending",
    date: c.created_at ? new Date(c.created_at).toLocaleDateString() : "—",
  }))

  const commissions = statusFilter === "all"
    ? allCommissions
    : allCommissions.filter((c: any) => c.status === statusFilter)

  const allRules = ((rulesData as any)?.items || (rulesData as any)?.commission_rules || []).map((item: any) => ({
    id: item.id,
    name: item.name || "—",
    vendor_type: item.vendor_type || "—",
    rate: item.rate != null ? `${item.rate}%` : "—",
    min_amount: item.min_amount ?? "—",
    max_amount: item.max_amount ?? "—",
    status: item.status || "active",
  }))

  const rules = rulesStatusFilter === "all"
    ? allRules
    : allRules.filter((i: any) => i.status === rulesStatusFilter)

  const commissionsColumns = [
    {
      key: "vendor",
      header: t(locale, "manage.vendor"),
      render: (val: unknown) => <span className="font-medium">{val as string}</span>,
    },
    {
      key: "order_id",
      header: t(locale, "manage.order_number"),
    },
    {
      key: "amount",
      header: t(locale, "manage.amount"),
      align: "end" as const,
    },
    {
      key: "commission_rate",
      header: t(locale, "manage.commission_rate"),
      align: "end" as const,
    },
    {
      key: "commission_amount",
      header: t(locale, "manage.commission_amount"),
      align: "end" as const,
    },
    {
      key: "status",
      header: t(locale, "manage.status"),
      render: (val: unknown) => <StatusBadge status={val as string} />,
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
            { type: "separator" as const },
            { label: t(locale, "manage.delete"), onClick: () => setDeleteId(row.id), variant: "danger" as const },
          ]}
        />
      ),
    },
  ]

  const rulesColumns = [
    {
      key: "name",
      header: t(locale, "manage.name"),
      render: (val: unknown) => <span className="font-medium">{val as string}</span>,
    },
    { key: "vendor_type", header: "Vendor Type" },
    { key: "rate", header: "Rate" },
    { key: "min_amount", header: "Min Amount" },
    { key: "max_amount", header: "Max Amount" },
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
            { label: t(locale, "common.actions.edit", "Edit"), onClick: () => handleEditRule(row) },
            { type: "separator" as const },
            { label: t(locale, "common.actions.delete", "Delete"), onClick: () => setDeleteRuleId(row.id), variant: "danger" as const },
          ]}
        />
      ),
    },
  ]

  if (isLoading && rulesLoading) {
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
          title={t(locale, "manage.commissions")}
          subtitle={t(locale, "manage.commissions_subtitle")}
          actions={
            activePageTab === "commissions" ? (
              config.canCreate !== false ? (
                <Button variant="primary" size="base" onClick={handleCreate}>
                  <Plus className="w-4 h-4" />
                  Add {config.singularLabel}
                </Button>
              ) : undefined
            ) : (
              <Button variant="primary" size="base" onClick={handleCreateRule}>
                <Plus className="w-4 h-4" />
                Add {rulesConfig.singularLabel}
              </Button>
            )
          }
        />

        <Tabs
          tabs={PAGE_TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
          activeTab={activePageTab}
          onTabChange={(tab) => { setActivePageTab(tab); setStatusFilter("all"); setRulesStatusFilter("all") }}
          className="mb-4"
        />

        {activePageTab === "commissions" && (
          <>
            <Tabs
              tabs={COMMISSION_STATUS_FILTERS.map((s) => ({
                id: s,
                label: s === "all" ? t(locale, "manage.all_statuses") : s.replace(/_/g, " "),
              }))}
              activeTab={statusFilter}
              onTabChange={setStatusFilter}
              className="mb-4"
            />

            <DataTable
              columns={commissionsColumns}
              data={commissions}
              emptyTitle={t(locale, "manage.no_commissions")}
              countLabel={t(locale, "manage.commissions").toLowerCase()}
            />
          </>
        )}

        {activePageTab === "rules" && (
          <>
            <Tabs
              tabs={RULES_STATUS_FILTERS.map((s) => ({
                id: s,
                label: s === "all" ? t(locale, "manage.all_statuses") : s.replace(/_/g, " "),
              }))}
              activeTab={rulesStatusFilter}
              onTabChange={setRulesStatusFilter}
              className="mb-4"
            />

            <DataTable columns={rulesColumns} data={rules} emptyTitle="No commission rules found" countLabel="rules" />
          </>
        )}
      </Container>

      <FormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingItem(null) }}
        title={editingItem ? `Edit ${config.singularLabel}` : `Add ${config.singularLabel}`}
        fields={config.fields}
        values={formValues}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        submitLabel={editingItem ? t(locale, "common.actions.update", "Update") : t(locale, "common.actions.create", "Create")}
      />

      <FormDrawer
        open={rulesDrawerOpen}
        onClose={() => { setRulesDrawerOpen(false); setEditingRule(null) }}
        title={editingRule ? `Edit ${rulesConfig.singularLabel}` : `Create ${rulesConfig.singularLabel}`}
        fields={rulesConfig.fields}
        values={rulesFormValues}
        onChange={handleRulesFormChange}
        onSubmit={handleRulesSubmit}
        loading={createRuleMutation.isPending || updateRuleMutation.isPending}
        submitLabel={editingRule ? t(locale, "common.actions.saveChanges", "Save changes") : t(locale, "common.actions.create", "Create")}
      />

      {config.canDelete !== false && (
        <ConfirmDialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title={`Delete ${config.singularLabel}`}
          description={`Are you sure you want to delete this ${config.singularLabel.toLowerCase()}? This action cannot be undone.`}
          loading={deleteMutation.isPending}
        />
      )}

      <ConfirmDialog
        open={!!deleteRuleId}
        onClose={() => setDeleteRuleId(null)}
        onConfirm={handleDeleteRule}
        title={`Delete ${rulesConfig.singularLabel}`}
        description={`Are you sure you want to delete this ${rulesConfig.singularLabel.toLowerCase()}? This action cannot be undone.`}
        loading={deleteRuleMutation.isPending}
      />
    </ManageLayout>
  )
}
