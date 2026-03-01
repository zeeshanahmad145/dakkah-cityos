import { createFileRoute } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { ManageLayout, ManageActivityFeed } from "@/components/manage"
import {
  Container,
  PageHeader,
  SectionCard,
  StatsGrid,
  SkeletonCard,
} from "@/components/manage/ui"
import { t } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { useManageStats } from "@/lib/hooks/use-manage-data"
import { Plus, ChevronRight } from "@medusajs/icons"

export const Route = createFileRoute("/$tenant/$locale/manage/")({
  component: ManageDashboard,
})

function StatsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

function ManageDashboard() {
  const { locale: routeLocale } = Route.useParams()
  const { locale: ctxLocale, tenantSlug } = useTenant()
  const locale = routeLocale || ctxLocale || "en"
  const baseHref = `/${tenantSlug}/${locale}/manage`

  const { data: stats, isLoading: statsLoading } = useManageStats()

  const quickActions = [
    {
      to: `${baseHref}/products`,
      label: t(locale, "manage.add_product"),
    },
    {
      to: `${baseHref}/orders`,
      label: t(locale, "manage.view_orders"),
    },
    {
      to: `${baseHref}/team`,
      label: t(locale, "manage.manage_team"),
    },
  ]

  return (
    <ManageLayout locale={locale}>
      <Container>
        <PageHeader
          title={t(locale, "manage.dashboard")}
          subtitle={t(locale, "manage.store_management")}
        />

        {statsLoading ? (
          <StatsLoadingSkeleton />
        ) : (
          <div className="mb-8">
            <StatsGrid
              stats={[
                {
                  label: t(locale, "manage.orders_today"),
                  value: stats?.totalOrders ?? 0,
                  trend: { value: 0, positive: true },
                },
                {
                  label: t(locale, "manage.revenue"),
                  value: `$${(stats?.totalRevenue ?? 0).toFixed(2)}`,
                },
                {
                  label: t(locale, "manage.active_products"),
                  value: stats?.totalProducts ?? 0,
                },
                {
                  label: t(locale, "manage.team_members"),
                  value: stats?.teamMembers ?? 0,
                },
              ]}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SectionCard title={t(locale, "manage.recent_activity")}>
              <ManageActivityFeed locale={locale} activities={[]} />
            </SectionCard>
          </div>
          <SectionCard title={t(locale, "manage.quick_actions")}>
            <div className="space-y-1">
              {quickActions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center gap-3 px-3 py-2 text-[13px] text-ds-muted-foreground hover:text-ds-foreground hover:bg-ds-muted/50 rounded-lg transition-colors"
                >
                  <span className="flex-1">{action.label}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      </Container>
    </ManageLayout>
  )
}
