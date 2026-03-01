import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { queryKeys } from "@/lib/utils/query-keys"
import type {
  TenantUser,
  TenantSettings,
  TenantBilling,
  TenantUsageRecord,
  TenantInvoice,
  AuditLog,
  AuditLogFilters,
  EventOutboxEntry,
  EventOutboxFilters,
  SalesChannelMapping,
  RegionZoneMapping,
} from "@/lib/types/tenant-admin"

async function adminFetch<T>(path: string, options?: { method?: string; body?: string; headers?: Record<string, string> }): Promise<T> {
  const response = await sdk.client.fetch<T>(path, {
    method: options?.method,
    headers: options?.headers,
    body: options?.body,
  })
  return response
}

export function useTenantUsers() {
  return useQuery({
    queryKey: queryKeys.tenantAdmin.users(),
    queryFn: () => adminFetch<{ users: TenantUser[] }>("/admin/tenant-users"),
  })
}

export function useCreateTenantUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<TenantUser>) =>
      adminFetch("/admin/tenant-users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenantAdmin.users(),
      }),
  })
}

export function useUpdateTenantUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string
      data: Partial<TenantUser>
    }) =>
      adminFetch(`/admin/tenant-users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenantAdmin.users(),
      }),
  })
}

export function useDeleteTenantUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      adminFetch(`/admin/tenant-users/${userId}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenantAdmin.users(),
      }),
  })
}

export function useTenantSettings() {
  return useQuery({
    queryKey: queryKeys.tenantAdmin.settings(),
    queryFn: () =>
      adminFetch<{ settings: TenantSettings }>("/admin/tenant-settings"),
  })
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<TenantSettings>) =>
      adminFetch("/admin/tenant-settings", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenantAdmin.settings(),
      }),
  })
}

export function useTenantBilling() {
  return useQuery({
    queryKey: queryKeys.tenantAdmin.billing(),
    queryFn: () =>
      adminFetch<{ billing: TenantBilling }>("/admin/tenant-billing"),
  })
}

export function useTenantUsage(options?: {
  period_start?: string
  period_end?: string
}) {
  return useQuery({
    queryKey: queryKeys.tenantAdmin.usage(options),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options?.period_start)
        params.set("period_start", options.period_start)
      if (options?.period_end) params.set("period_end", options.period_end)
      return adminFetch<{ records: TenantUsageRecord[] }>(
        `/admin/tenant-usage?${params}`,
      )
    },
  })
}

export function useTenantInvoices() {
  return useQuery({
    queryKey: queryKeys.tenantAdmin.invoices(),
    queryFn: () =>
      adminFetch<{ invoices: TenantInvoice[] }>("/admin/tenant-invoices"),
  })
}

export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.actor_id) params.set("actor_id", filters.actor_id)
      if (filters?.action) params.set("action", filters.action)
      if (filters?.entity_type) params.set("entity_type", filters.entity_type)
      if (filters?.entity_id) params.set("entity_id", filters.entity_id)
      if (filters?.data_classification)
        params.set("data_classification", filters.data_classification)
      if (filters?.created_after)
        params.set("created_after", filters.created_after)
      if (filters?.created_before)
        params.set("created_before", filters.created_before)
      return adminFetch<{ logs: AuditLog[]; count: number }>(
        `/admin/audit-logs?${params}`,
      )
    },
  })
}

export function useEventOutbox(filters?: EventOutboxFilters) {
  return useQuery({
    queryKey: queryKeys.eventOutbox.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.event_type) params.set("event_type", filters.event_type)
      if (filters?.entity_type) params.set("entity_type", filters.entity_type)
      if (filters?.status) params.set("status", filters.status)
      if (filters?.created_after)
        params.set("created_after", filters.created_after)
      if (filters?.created_before)
        params.set("created_before", filters.created_before)
      return adminFetch<{ events: EventOutboxEntry[]; count: number }>(
        `/admin/event-outbox?${params}`,
      )
    },
  })
}

export function useSalesChannelMappings() {
  return useQuery({
    queryKey: queryKeys.channelMappings.all,
    queryFn: () =>
      adminFetch<{ mappings: SalesChannelMapping[] }>(
        "/admin/channel-mappings",
      ),
  })
}

export function useCreateSalesChannelMapping() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<SalesChannelMapping>) =>
      adminFetch("/admin/channel-mappings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.channelMappings.all,
      }),
  })
}

export function useRegionZoneMappings() {
  return useQuery({
    queryKey: queryKeys.regionZones.all,
    queryFn: () =>
      adminFetch<{ mappings: RegionZoneMapping[] }>(
        "/admin/region-zone-mappings",
      ),
  })
}

export function useCreateRegionZoneMapping() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<RegionZoneMapping>) =>
      adminFetch("/admin/region-zone-mappings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.regionZones.all }),
  })
}
