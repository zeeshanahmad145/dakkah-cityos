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
  useToast,
} from "@/components/manage/ui"
import { t } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { crudConfigs } from "@/components/manage/crud-configs"

export const Route = createFileRoute("/$tenant/$locale/manage/wishlists")({
  component: ManageWishlistsPage,
})

const config = crudConfigs["wishlists"]
const STATUS_FILTERS = ["all", "public", "private"] as const

function ManageWishlistsPage() {
  const { locale: routeLocale } = Route.useParams()
  const { locale: ctxLocale } = useTenant()
  const locale = routeLocale || ctxLocale || "en"
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const { data, isLoading } = useQuery({
    queryKey: ["manage", "wishlists"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/wishlists", {
        method: "GET",
      })
      return response
    },
    enabled: typeof window !== "undefined",
  })

  const allItems = ((data as any)?.wishlists || []).map((item: any) => ({
    id: item.id,
    name: item.name || item.title || "—",
    type: item.type || "—",
    status: item.status || item.visibility || "private",
  }))

  const items =
    statusFilter === "all"
      ? allItems
      : allItems.filter((i: any) => i.status === statusFilter)

  const columns = [
    {
      key: "name",
      header: t(locale, "manage.name"),
      render: (val: unknown) => (
        <span className="font-medium">{val as string}</span>
      ),
    },
    {
      key: "type",
      header: t(locale, "manage.type"),
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
          <SkeletonTable rows={8} cols={3} />
        </Container>
      </ManageLayout>
    )
  }

  return (
    <ManageLayout locale={locale}>
      <Container>
        <PageHeader title={config.label} subtitle="View wishlists" />

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
          emptyTitle="No wishlists found"
          countLabel="wishlists"
        />
      </Container>
    </ManageLayout>
  )
}
