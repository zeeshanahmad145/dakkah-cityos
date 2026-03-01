// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { ManageLayout } from "@/components/manage"
import {
  Container,
  PageHeader,
  DataTable,
  StatusBadge,
  SkeletonTable,
} from "@/components/manage/ui"
import { t } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"

export const Route = createFileRoute("/$tenant/$locale/manage/temporal")({
  component: ManageTemporalPage,
})

function ManageTemporalPage() {
  const { locale: routeLocale } = Route.useParams()
  const { locale: ctxLocale } = useTenant()
  const locale = routeLocale || ctxLocale || "en"

  const { data, isLoading } = useQuery({
    queryKey: ["manage", "temporal"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/temporal", {
        method: "GET",
      })
      return response
    },
    enabled: typeof window !== "undefined",
  })

  const items = ((data as any)?.items || data?.workflows || []).map((item: any) => ({
    id: item.id || item.workflow_id,
    workflow_id: item.workflow_id || item.id || "—",
    type: item.type || item.workflow_type || "—",
    status: item.status || "unknown",
    started_at: item.started_at || item.start_time || "—",
    duration: item.duration || "—",
  }))

  const columns = [
    {
      key: "workflow_id",
      header: "Workflow ID",
      render: (val: unknown) => (
        <span className="font-medium font-mono text-sm">{val as string}</span>
      ),
    },
    { key: "type", header: t(locale, "manage.type") },
    {
      key: "status",
      header: t(locale, "manage.status"),
      render: (val: unknown) => <StatusBadge status={val as string} />,
    },
    { key: "started_at", header: "Started At" },
    { key: "duration", header: "Duration" },
  ]

  if (isLoading) {
    return (
      <ManageLayout locale={locale}>
        <Container>
          <SkeletonTable rows={8} cols={5} />
        </Container>
      </ManageLayout>
    )
  }

  return (
    <ManageLayout locale={locale}>
      <Container>
        <PageHeader
          title="Temporal Workflows"
          subtitle="Monitor temporal workflow executions"
        />

        <DataTable
          columns={columns}
          data={items}
          emptyTitle="No workflows found"
          countLabel="workflows"
        />
      </Container>
    </ManageLayout>
  )
}
