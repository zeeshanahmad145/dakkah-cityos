import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { ManageLayout } from "@/components/manage"
import {
  Container,
  PageHeader,
  DataTable,
  StatusBadge,
  SkeletonTable,
  Tabs,
  DropdownMenu,
  useToast,
} from "@/components/manage/ui"
import { t } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { crudConfigs } from "@/components/manage/crud-configs"

export const Route = createFileRoute("/$tenant/$locale/manage/audit")({
  component: ManageAuditPage,
})

const config = crudConfigs["audit"]
const STATUS_FILTERS = ["all", "create", "update", "delete", "login"] as const

function ManageAuditPage() {
  const { locale: routeLocale } = Route.useParams()
  const { locale: ctxLocale } = useTenant()
  const locale = routeLocale || ctxLocale || "en"
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const { data, isLoading } = useQuery({
    queryKey: ["manage", "audit"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/audit", { method: "GET" })
      return response
    },
    enabled: typeof window !== "undefined",
  })

  const allItems = ((data as any)?.audit || (data as any)?.items || []).map((item: any) => ({
    id: item.id,
    action: item.action || "—",
    entity: item.entity || item.entity_type || "—",
    entity_id: item.entity_id || "—",
    user: item.user || item.actor || "—",
    timestamp: item.timestamp || item.created_at || "—",
    status: item.action || item.status || "create",
  }))

  const items =
    statusFilter === "all"
      ? allItems
      : allItems.filter((i: any) => i.status === statusFilter)

  const columns = [
    {
      key: "action",
      header: t(locale, "manage.action"),
      render: (val: unknown) => (
        <span className="font-medium">{val as string}</span>
      ),
    },
    {
      key: "entity",
      header: t(locale, "manage.entity"),
    },
    {
      key: "entity_id",
      header: t(locale, "manage.entity_id"),
    },
    {
      key: "user",
      header: t(locale, "manage.user"),
    },
    {
      key: "timestamp",
      header: t(locale, "manage.timestamp"),
    },
    {
      key: "status",
      header: t(locale, "manage.status"),
      render: (val: unknown) => <StatusBadge status={val as string} />,
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
        <PageHeader title={config.label} subtitle="View audit log entries" />

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
          emptyTitle="No audit entries found"
          countLabel="entries"
        />
      </Container>
    </ManageLayout>
  )
}
