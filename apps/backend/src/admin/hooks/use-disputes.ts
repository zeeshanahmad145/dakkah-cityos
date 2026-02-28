import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/client.js";

export type Dispute = {
  id: string;
  order_id: string;
  customer_id: string;
  type: string;
  description?: string;
  status: "open" | "under_review" | "escalated" | "resolved" | "closed";
  resolution?: string;
  resolution_type?: "refund" | "replacement" | "credit" | "rejected";
  resolution_amount?: number;
  currency_code?: string;
  evidence?: {
    type: string;
    url: string;
    description?: string;
  }[];
  customer?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  assigned_to?: string;
  escalated_at?: string;
  resolved_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export function useDisputes(params?: {
  status?: string;
  customer_id?: string;
  order_id?: string;
}) {
  return useQuery({
    queryKey: ["disputes", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      if (params?.customer_id)
        searchParams.set("customer_id", params.customer_id);
      if (params?.order_id) searchParams.set("order_id", params.order_id);

      const query = searchParams.toString();
      const response = await sdk.client.fetch(
        `/admin/disputes${query ? `?${query}` : ""}`,
      );
      return response as { disputes: Dispute[] };
    },
  });
}

export function useUpdateDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Dispute> & { id: string }) => {
      const response = await sdk.client.fetch(`/admin/disputes/${id}`, {
        method: "PUT",
        body: data,
      });
      return response as { dispute: Dispute };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}

export function useEscalateDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await sdk.client.fetch(
        `/admin/disputes/${id}/escalate`,
        {
          method: "POST",
          body: { reason },
        },
      );
      return response as { dispute: Dispute };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}

export function useResolveDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      resolution,
      resolution_type,
    }: {
      id: string;
      resolution: string;
      resolution_type: string;
    }) => {
      const response = await sdk.client.fetch(`/admin/disputes/${id}/resolve`, {
        method: "POST",
        body: { resolution, resolution_type },
      });
      return response as { dispute: Dispute };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}
