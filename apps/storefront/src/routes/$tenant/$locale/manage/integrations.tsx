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

export const Route = createFileRoute("/$tenant/$locale/manage/integrations")({
  component: ManageIntegrationsPage,
})

function ManageIntegrationsPage() {
  const { locale: routeLocale } = Route.useParams()
  const { locale: ctxLocale } = useTenant()
  const locale = routeLocale || ctxLocale || "en"

  const { data, isLoading } = useQuery({
    queryKey: ["manage", "integrations"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/integrations", {
        method: "GET",
      })
      return response
    },
    enabled: typeof window !== "undefined",
  })

  const items = ((data as any)?.items || data?.integrations || []).map((item: any) => ({
    id: item.id,
    system: item.system || item.name || "—",
    status: item.status || "unknown",
    last_sync: item.last_sync || item.last_synced_at || "—",
    health: item.health || item.health_status || "—",
  }))

  const columns = [
    {
      key: "system",
      header: "System",
      render: (val: unknown) => (
        <span className="font-medium">{val as string}</span>
      ),
    },
    {
      key: "status",
      header: t(locale, "manage.status"),
      render: (val: unknown) => <StatusBadge status={val as string} />,
    },
    { key: "last_sync", header: "Last Sync" },
    {
      key: "health",
      header: "Health",
      render: (val: unknown) => <StatusBadge status={val as string} />,
    },
  ]

  if (isLoading) {
    return (
      <ManageLayout locale={locale}>
        <Container>
          <SkeletonTable rows={8} cols={4} />
        </Container>
      </ManageLayout>
    )
  }

  return (
    <ManageLayout locale={locale}>
      <Container>
        <PageHeader
          title="Integrations"
          subtitle="Integration status and health dashboard"
        />

        <DataTable
          columns={columns}
          data={items}
          emptyTitle="No integrations found"
          countLabel="integrations"
        />
      </Container>
    </ManageLayout>
  )
}
