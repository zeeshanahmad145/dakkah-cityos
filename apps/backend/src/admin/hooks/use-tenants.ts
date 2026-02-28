import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/client.js";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  handle?: string;
  domain?: string;
  email: string;
  phone?: string;
  plan: "free" | "starter" | "professional" | "enterprise";
  status: "pending" | "active" | "suspended" | "canceled";
  settings?: TenantSettings;
  billing?: TenantBilling;
  users?: TenantUser[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type TenantSettings = {
  id: string;
  tenant_id: string;
  logo?: string;
  favicon?: string;
  primary_color?: string;
  timezone: string;
  locale: string;
  currency_code: string;
  features_enabled: string[];
  custom_domain_verified: boolean;
};

export type TenantBilling = {
  id: string;
  tenant_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  billing_email: string;
  billing_name?: string;
  billing_address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  current_period_start?: string;
  current_period_end?: string;
  plan_price: number;
  currency_code: string;
};

export type TenantUser = {
  id: string;
  tenant_id: string;
  email: string;
  name?: string;
  role: "owner" | "admin" | "member";
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
};

export type TenantUsageRecord = {
  id: string;
  tenant_id: string;
  metric: string;
  value: number;
  recorded_at: string;
};

export type TenantInvoice = {
  id: string;
  tenant_id: string;
  stripe_invoice_id?: string;
  amount: number;
  currency_code: string;
  status: "draft" | "open" | "paid" | "uncollectible" | "void";
  period_start: string;
  period_end: string;
  paid_at?: string;
  invoice_url?: string;
  created_at: string;
};

export type PlatformMetrics = {
  total_tenants: number;
  active_tenants: number;
  total_revenue: number;
  mrr: number;
  tenants_by_plan: Record<string, number>;
  tenants_by_status: Record<string, number>;
  new_tenants_this_month: number;
  churned_tenants_this_month: number;
};

// Tenants hooks
export function useTenants(params?: {
  status?: string;
  plan?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["tenants", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      if (params?.plan) searchParams.set("plan", params.plan);
      if (params?.search) searchParams.set("q", params.search);

      const query = searchParams.toString();
      const response = await sdk.client.fetch(
        `/admin/tenants${query ? `?${query}` : ""}`,
      );
      return response as { tenants: Tenant[] };
    },
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ["tenants", id],
    queryFn: async () => {
      const response = await sdk.client.fetch(`/admin/tenants/${id}`);
      return response as { tenant: Tenant };
    },
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Tenant>) => {
      const response = await sdk.client.fetch(`/admin/tenants`, {
        method: "POST",
        body: data,
      });
      return response as { tenant: Tenant };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Tenant> & { id: string }) => {
      const response = await sdk.client.fetch(`/admin/tenants/${id}`, {
        method: "PUT",
        body: data,
      });
      return response as { tenant: Tenant };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenants", variables.id] });
    },
  });
}

export function useSuspendTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await sdk.client.fetch(`/admin/tenants/${id}/suspend`, {
        method: "POST",
        body: { reason },
      });
      return response as { tenant: Tenant };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

export function useActivateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await sdk.client.fetch(`/admin/tenants/${id}/activate`, {
        method: "POST",
      });
      return response as { tenant: Tenant };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

// Tenant users hooks
export function useTenantUsers(tenantId: string) {
  return useQuery({
    queryKey: ["tenants", tenantId, "users"],
    queryFn: async () => {
      const response = await sdk.client.fetch(
        `/admin/tenants/${tenantId}/users`,
      );
      return response as { users: TenantUser[] };
    },
    enabled: !!tenantId,
  });
}

export function useAddTenantUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      ...data
    }: {
      tenantId: string;
      email: string;
      name?: string;
      role: string;
    }) => {
      const response = await sdk.client.fetch(
        `/admin/tenants/${tenantId}/users`,
        {
          method: "POST",
          body: data,
        },
      );
      return response as { user: TenantUser };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tenants", variables.tenantId, "users"],
      });
    },
  });
}

// Tenant billing hooks
export function useTenantBilling(tenantId: string) {
  return useQuery({
    queryKey: ["tenants", tenantId, "billing"],
    queryFn: async () => {
      const response = await sdk.client.fetch(
        `/admin/tenants/${tenantId}/billing`,
      );
      return response as { billing: TenantBilling; invoices: TenantInvoice[] };
    },
    enabled: !!tenantId,
  });
}

// Tenant usage hooks
export function useTenantUsage(
  tenantId: string,
  params?: { date_from?: string; date_to?: string },
) {
  return useQuery({
    queryKey: ["tenants", tenantId, "usage", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.date_from) searchParams.set("date_from", params.date_from);
      if (params?.date_to) searchParams.set("date_to", params.date_to);

      const query = searchParams.toString();
      const response = await sdk.client.fetch(
        `/admin/tenants/${tenantId}/usage${query ? `?${query}` : ""}`,
      );
      return response as { usage: TenantUsageRecord[] };
    },
    enabled: !!tenantId,
  });
}

// Platform metrics (super admin)
export function usePlatformMetrics() {
  return useQuery({
    queryKey: ["platform-metrics"],
    queryFn: async () => {
      const response = await sdk.client.fetch(`/admin/platform/metrics`);
      return response as { metrics: PlatformMetrics };
    },
  });
}
