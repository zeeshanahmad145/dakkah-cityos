import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/client.js";

export type WarrantyTemplate = {
  id: string;
  name: string;
  description?: string;
  plan_type: "standard" | "extended" | "premium" | "accidental";
  duration_months: number;
  price?: number;
  currency_code: string;
  coverage: Record<string, unknown>;
  exclusions?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function useWarrantyTemplates(params?: {
  status?: string;
  coverage_type?: string;
}) {
  return useQuery({
    queryKey: ["warranty-templates", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      if (params?.coverage_type)
        searchParams.set("coverage_type", params.coverage_type);

      const query = searchParams.toString();
      const response = await sdk.client.fetch(
        `/admin/warranties${query ? `?${query}` : ""}`,
      );
      return response as { templates: WarrantyTemplate[] };
    },
  });
}

export function useCreateWarrantyTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<WarrantyTemplate>) => {
      const response = await sdk.client.fetch(`/admin/warranties`, {
        method: "POST",
        body: data,
      });
      return response as { template: WarrantyTemplate };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warranty-templates"] });
    },
  });
}

export function useUpdateWarrantyTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<WarrantyTemplate> & { id: string }) => {
      const response = await sdk.client.fetch(`/admin/warranties/${id}`, {
        method: "PUT",
        body: data,
      });
      return response as { template: WarrantyTemplate };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["warranty-templates"] });
      queryClient.invalidateQueries({
        queryKey: ["warranty-templates", variables.id],
      });
    },
  });
}

export function useDeleteWarrantyTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await sdk.client.fetch(`/admin/warranties/${id}`, {
        method: "DELETE",
      });
      return response as { success: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warranty-templates"] });
    },
  });
}
