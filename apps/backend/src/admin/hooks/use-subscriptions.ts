import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/client.js";

export type SubscriptionPlan = {
  id: string;
  name: string;
  description?: string;
  handle: string;
  billing_interval: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  billing_interval_count: number;
  price: number;
  currency_code: string;
  trial_days: number;
  features: string[];
  status: "draft" | "active" | "archived";
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  customer_id: string;
  plan_id: string;
  status:
    | "trialing"
    | "active"
    | "paused"
    | "canceled"
    | "past_due"
    | "expired";
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  canceled_at?: string;
  pause_starts_at?: string;
  pause_ends_at?: string;
  customer?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  plan?: SubscriptionPlan;
  items: SubscriptionItem[];
  events: SubscriptionEvent[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SubscriptionItem = {
  id: string;
  subscription_id: string;
  product_id?: string;
  variant_id?: string;
  title: string;
  quantity: number;
  unit_price: number;
  created_at: string;
};

export type SubscriptionEvent = {
  id: string;
  subscription_id: string;
  type:
    | "created"
    | "activated"
    | "paused"
    | "resumed"
    | "canceled"
    | "renewed"
    | "plan_changed"
    | "payment_failed";
  data?: Record<string, unknown>;
  created_at: string;
};

export type SubscriptionMetrics = {
  mrr: number;
  arr: number;
  active_subscriptions: number;
  trialing_subscriptions: number;
  churn_rate: number;
  average_revenue_per_subscription: number;
  new_subscriptions_this_month: number;
  cancellations_this_month: number;
};

// Subscription plans hooks
export function useSubscriptionPlans(params?: { status?: string }) {
  return useQuery({
    queryKey: ["subscription-plans", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status !== undefined)
        searchParams.set("status", params.status);

      const query = searchParams.toString();
      const response = await sdk.client.fetch(
        `/admin/subscription-plans${query ? `?${query}` : ""}`,
      );
      return response as { plans: SubscriptionPlan[] };
    },
  });
}

export function useSubscriptionPlan(id: string) {
  return useQuery({
    queryKey: ["subscription-plans", id],
    queryFn: async () => {
      const response = await sdk.client.fetch(
        `/admin/subscription-plans/${id}`,
      );
      return response as { plan: SubscriptionPlan };
    },
    enabled: !!id,
  });
}

export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<SubscriptionPlan>) => {
      const response = await sdk.client.fetch(`/admin/subscription-plans`, {
        method: "POST",
        body: data,
      });
      return response as { plan: SubscriptionPlan };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<SubscriptionPlan> & { id: string }) => {
      const response = await sdk.client.fetch(
        `/admin/subscription-plans/${id}`,
        {
          method: "PUT",
          body: data,
        },
      );
      return response as { plan: SubscriptionPlan };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      queryClient.invalidateQueries({
        queryKey: ["subscription-plans", variables.id],
      });
    },
  });
}

// Subscriptions hooks
export function useSubscriptions(params?: {
  status?: string;
  plan_id?: string;
  customer_id?: string;
}) {
  return useQuery({
    queryKey: ["subscriptions", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      if (params?.plan_id) searchParams.set("plan_id", params.plan_id);
      if (params?.customer_id)
        searchParams.set("customer_id", params.customer_id);

      const query = searchParams.toString();
      const response = await sdk.client.fetch(
        `/admin/subscriptions${query ? `?${query}` : ""}`,
      );
      return response as { subscriptions: Subscription[] };
    },
  });
}

export function useSubscription(id: string) {
  return useQuery({
    queryKey: ["subscriptions", id],
    queryFn: async () => {
      const response = await sdk.client.fetch(`/admin/subscriptions/${id}`);
      return response as { subscription: Subscription };
    },
    enabled: !!id,
  });
}

export function usePauseSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      pause_ends_at,
    }: {
      id: string;
      pause_ends_at?: string;
    }) => {
      const response = await sdk.client.fetch(
        `/admin/subscriptions/${id}/pause`,
        {
          method: "POST",
          body: { pause_ends_at },
        },
      );
      return response as { subscription: Subscription };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

export function useResumeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await sdk.client.fetch(
        `/admin/subscriptions/${id}/resume`,
        {
          method: "POST",
        },
      );
      return response as { subscription: Subscription };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reason,
      immediate,
    }: {
      id: string;
      reason?: string;
      immediate?: boolean;
    }) => {
      const response = await sdk.client.fetch(
        `/admin/subscriptions/${id}/cancel`,
        {
          method: "POST",
          body: { reason, immediate },
        },
      );
      return response as { subscription: Subscription };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

export function useChangePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      plan_id,
      prorate,
    }: {
      id: string;
      plan_id: string;
      prorate?: boolean;
    }) => {
      const response = await sdk.client.fetch(
        `/admin/subscriptions/${id}/change-plan`,
        {
          method: "POST",
          body: { plan_id, prorate },
        },
      );
      return response as { subscription: Subscription };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

// Metrics hooks
export function useSubscriptionMetrics() {
  return useQuery({
    queryKey: ["subscription-metrics"],
    queryFn: async () => {
      const response = await sdk.client.fetch(`/admin/subscriptions/metrics`);
      return response as { metrics: SubscriptionMetrics };
    },
  });
}
