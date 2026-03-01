import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  SubscriptionPlan,
  Subscription,
  SubscriptionCheckoutData,
} from "@/lib/types/subscriptions"

// Query Keys
export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  plans: () => [...subscriptionKeys.all, "plans"] as const,
  plan: (id: string) => [...subscriptionKeys.plans(), id] as const,
  list: () => [...subscriptionKeys.all, "list"] as const,
  detail: (id: string) => [...subscriptionKeys.all, "detail", id] as const,
  invoices: (id: string) => [...subscriptionKeys.all, "invoices", id] as const,
}

// API Fetch helper
async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = getServerBaseUrl()
  const response = await fetchWithTimeout(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }))
    throw new Error((error instanceof Error ? error.message : String(error)) || "Request failed")
  }

  return response.json()
}

// Hooks
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: subscriptionKeys.plans(),
    queryFn: async () => {
      const response = await fetchApi<{ plans: SubscriptionPlan[] }>(
        "/store/subscription-plans",
      )
      return response.plans || []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useSubscriptionPlan(planId: string) {
  const { data: plans } = useSubscriptionPlans()

  return useQuery({
    queryKey: subscriptionKeys.plan(planId),
    queryFn: async () => {
      return plans?.find((p) => p.id === planId || p.handle === planId)
    },
    enabled: !!planId && !!plans,
  })
}

export function useCustomerSubscriptions() {
  return useQuery({
    queryKey: subscriptionKeys.list(),
    queryFn: async () => {
      const response = await fetchApi<{ subscriptions: Subscription[] }>(
        "/store/subscriptions/me",
      )
      return response.subscriptions || []
    },
  })
}

export function useSubscription(subscriptionId: string) {
  return useQuery({
    queryKey: subscriptionKeys.detail(subscriptionId),
    queryFn: async () => {
      const response = await fetchApi<{ subscription: Subscription }>(
        `/store/subscriptions/${subscriptionId}`,
      )
      return response.subscription
    },
    enabled: !!subscriptionId,
  })
}

export function useCreateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SubscriptionCheckoutData) => {
      const response = await fetchApi<{ subscription: Subscription }>(
        "/store/subscriptions",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      )
      return response.subscription
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.list() })
    },
  })
}

export function usePauseSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      resumeDate,
    }: {
      subscriptionId: string
      resumeDate?: string
    }) => {
      const response = await fetchApi<{ subscription: Subscription }>(
        `/store/subscriptions/${subscriptionId}/pause`,
        {
          method: "POST",
          body: JSON.stringify({ resume_date: resumeDate }),
        },
      )
      return response.subscription
    },
    onSuccess: (_, { subscriptionId }) => {
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(subscriptionId),
      })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.list() })
    },
  })
}

export function useResumeSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await fetchApi<{ subscription: Subscription }>(
        `/store/subscriptions/${subscriptionId}/resume`,
        { method: "POST" },
      )
      return response.subscription
    },
    onSuccess: (_, subscriptionId) => {
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(subscriptionId),
      })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.list() })
    },
  })
}

export function useCancelSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      immediately,
    }: {
      subscriptionId: string
      immediately?: boolean
    }) => {
      const response = await fetchApi<{ subscription: Subscription }>(
        `/store/subscriptions/${subscriptionId}/cancel`,
        {
          method: "POST",
          body: JSON.stringify({ immediately }),
        },
      )
      return response.subscription
    },
    onSuccess: (_, { subscriptionId }) => {
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(subscriptionId),
      })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.list() })
    },
  })
}

export function useChangePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      newPlanId,
    }: {
      subscriptionId: string
      newPlanId: string
    }) => {
      const response = await fetchApi<{ subscription: Subscription }>(
        `/store/subscriptions/${subscriptionId}/change-plan`,
        {
          method: "POST",
          body: JSON.stringify({ plan_id: newPlanId }),
        },
      )
      return response.subscription
    },
    onSuccess: (_, { subscriptionId }) => {
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(subscriptionId),
      })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.list() })
    },
  })
}
