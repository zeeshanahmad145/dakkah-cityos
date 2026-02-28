import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/client.js";

export type GovernanceAuthority = {
  id: string;
  name: string;
  slug: string;
  code?: string;
  type: "region" | "country" | "authority";
  jurisdiction_level: number;
  parent_authority_id?: string;
  status: "active" | "inactive";
  policies?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export function useGovernanceAuthorities(params?: {
  type?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["governance", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.set("type", params.type);
      if (params?.status) searchParams.set("status", params.status);
      if (params?.search) searchParams.set("q", params.search);
      const query = searchParams.toString();
      const response = await sdk.client.fetch(
        `/admin/governance${query ? `?${query}` : ""}`,
      );
      return response as { items: GovernanceAuthority[] };
    },
  });
}

export function useCreateGovernanceAuthority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<GovernanceAuthority>) => {
      const response = await sdk.client.fetch(`/admin/governance`, {
        method: "POST",
        body: data,
      });
      return response as { item: GovernanceAuthority };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["governance"] });
    },
  });
}

export function useUpdateGovernanceAuthority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<GovernanceAuthority> & { id: string }) => {
      const response = await sdk.client.fetch(`/admin/governance/${id}`, {
        method: "PUT",
        body: data,
      });
      return response as { item: GovernanceAuthority };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["governance"] });
    },
  });
}

export function useDeleteGovernanceAuthority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await sdk.client.fetch(`/admin/governance/${id}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["governance"] });
    },
  });
}
