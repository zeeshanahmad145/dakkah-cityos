// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { ManageLayout } from "@/components/manage"
import {
  Container,
  PageHeader,
  DataTable,
  SkeletonTable,
} from "@/components/manage/ui"
import { t } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"

export const Route = createFileRoute("/$tenant/$locale/manage/metrics")({
  component: ManageMetricsPage,
})

function ManageMetricsPage() {
  const { locale: routeLocale } = Route.useParams()
  const { locale: ctxLocale } = useTenant()
  const locale = routeLocale || ctxLocale || "en"

  const { data, isLoading } = useQuery({
    queryKey: ["manage", "metrics"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/metrics", {
        method: "GET",
      })
      return response
    },
    enabled: typeof window !== "undefined",
  })

  const items = ((data as any)?.items || data?.metrics || []).map((item: any) => ({
    id: item.id || item.key || item.metric,
    metric: item.metric || item.name || item.key || "—",
    value: item.value ?? "—",
    change: item.change || item.trend || "—",
    period: item.period || "—",
    updated_at: item.updated_at || "—",
  }))

  const columns = [
    {
      key: "metric",
      header: "Metric",
      render: (val: unknown) => (
        <span className="font-medium">{val as string}</span>
      ),
    },
    { key: "value", header: "Value" },
    { key: "change", header: "Change" },
    { key: "period", header: "Period" },
    { key: "updated_at", header: "Last Updated" },
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
          title="Platform Metrics"
          subtitle="Key performance metrics and analytics"
        />

        <DataTable
          columns={columns}
          data={items}
          emptyTitle="No metrics available"
          countLabel="metrics"
        />
      </Container>
    </ManageLayout>
  )
}
