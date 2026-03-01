import { type ReactNode, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ManageLayout } from "@/components/manage"
import { Container } from "./container"
import { PageHeader } from "./page-header"
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "./data-table"
import { StatsGrid } from "./stats-grid"
import { Drawer } from "./drawer"
import { Button } from "./button"
import { SkeletonTable } from "./skeleton"
import { useTenant } from "@/lib/context/tenant-context"
import { sdk } from "@/lib/utils/sdk"
import { Plus } from "@medusajs/icons"

interface Column<T = Record<string, unknown>> {
  key: string
  header: string
  render?: (value: unknown, row: T) => ReactNode
  align?: "start" | "center" | "end"
  sortable?: boolean
  filterable?: boolean
  width?: string
}

interface CrudPageProps {
  locale: string
  moduleKey: string
  title: string
  subtitle?: string
  breadcrumbs?: ReactNode
  icon?: React.ComponentType<{ className?: string }>
  columns: Column[]
  data: any[]
  isLoading: boolean
  searchable?: boolean
  searchKey?: string
  searchPlaceholder?: string
  filters?: DataTableFilter[]
  pageSize?: number
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  countLabel?: string
  actions?: ReactNode
  stats?: Array<{
    label: string
    value: string | number
    trend?: { value: number; positive: boolean }
    icon?: ReactNode
    description?: string
  }>
  drawerTitle?: string
  drawerContent?: ReactNode
  drawerFooter?: ReactNode
  drawerOpen?: boolean
  onDrawerClose?: () => void
  onRowClick?: (row: any, index: number) => void
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 bg-ds-border/60 rounded w-48" />
        <div className="h-4 bg-ds-border/60 rounded w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-ds-border/60 rounded-lg" />
        ))}
      </div>
      <SkeletonTable rows={5} cols={4} />
    </div>
  )
}

export function CrudPage({
  locale,
  moduleKey,
  title,
  subtitle,
  breadcrumbs,
  icon: Icon,
  columns,
  data,
  isLoading,
  searchable = false,
  searchKey,
  searchPlaceholder,
  filters,
  pageSize,
  emptyTitle,
  emptyDescription,
  emptyAction,
  countLabel,
  actions,
  stats,
  drawerTitle,
  drawerContent,
  drawerFooter,
  drawerOpen,
  onDrawerClose,
  onRowClick,
}: CrudPageProps) {
  if (isLoading) {
    return (
      <ManageLayout locale={locale}>
        <Container>
          <LoadingSkeleton />
        </Container>
      </ManageLayout>
    )
  }

  return (
    <ManageLayout locale={locale}>
      <Container>
        <PageHeader
          title={title}
          subtitle={subtitle}
          breadcrumbs={breadcrumbs}
          actions={
            <div className="flex items-center gap-2">
              {Icon && <Icon className="w-5 h-5 text-ds-muted-foreground/70" />}
              {actions}
            </div>
          }
        />

        {stats && stats.length > 0 && <StatsGrid stats={stats} />}

        <DataTable
          columns={columns as DataTableColumn<Record<string, unknown>>[]}
          data={data}
          searchable={searchable}
          searchPlaceholder={searchPlaceholder}
          searchKey={searchKey}
          filters={filters}
          pageSize={pageSize}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          emptyAction={emptyAction}
          countLabel={countLabel}
          onRowClick={onRowClick}
        />
      </Container>

      {drawerTitle && onDrawerClose && (
        <Drawer
          open={!!drawerOpen}
          onClose={onDrawerClose}
          title={drawerTitle}
          footer={drawerFooter}
        >
          {drawerContent}
        </Drawer>
      )}
    </ManageLayout>
  )
}

interface ManageModulePageProps {
  moduleKey: string
  apiEndpoint: string
  columns: Column[]
  title: string
  subtitle?: string
  breadcrumbs?: ReactNode
  icon?: React.ComponentType<{ className?: string }>
  searchable?: boolean
  searchKey?: string
  searchPlaceholder?: string
  filters?: DataTableFilter[]
  pageSize?: number
  emptyTitle?: string
  emptyDescription?: string
  countLabel?: string
  addLabel?: string
  actions?: ReactNode
  stats?: Array<{
    label: string
    value: string | number
    trend?: { value: number; positive: boolean }
    icon?: ReactNode
    description?: string
  }>
  transformData?: (response: any) => any[]
  queryParams?: Record<string, unknown>
  onRowClick?: (row: any, index: number) => void
}

export function ManageModulePage({
  moduleKey,
  apiEndpoint,
  columns,
  title,
  subtitle,
  breadcrumbs,
  icon,
  searchable = false,
  searchKey,
  searchPlaceholder,
  filters,
  pageSize,
  emptyTitle,
  emptyDescription,
  countLabel,
  addLabel,
  actions,
  stats,
  transformData,
  queryParams,
  onRowClick,
}: ManageModulePageProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = ctxLocale || "en"

  const { data: response, isLoading } = useQuery({
    queryKey: ["manage", moduleKey, apiEndpoint, queryParams],
    queryFn: async () => {
      const res = await sdk.client.fetch(apiEndpoint, {
        method: "GET",
        query: queryParams,
      })
      return res
    },
    enabled: typeof window !== "undefined",
  })

  const data = transformData
    ? transformData(response)
    : (response as any)?.[moduleKey] || (response as any)?.data || []

  const resolvedActions = addLabel ? (
    <Button variant="primary" size="base">
      <Plus className="w-4 h-4" />
      {addLabel}
    </Button>
  ) : (
    actions
  )

  return (
    <CrudPage
      locale={locale}
      moduleKey={moduleKey}
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      icon={icon}
      columns={columns}
      data={data}
      isLoading={isLoading}
      searchable={searchable}
      searchKey={searchKey}
      searchPlaceholder={searchPlaceholder}
      filters={filters}
      pageSize={pageSize}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      countLabel={countLabel}
      actions={resolvedActions}
      stats={stats}
      onRowClick={onRowClick}
    />
  )
}

export type { CrudPageProps, ManageModulePageProps, Column }
