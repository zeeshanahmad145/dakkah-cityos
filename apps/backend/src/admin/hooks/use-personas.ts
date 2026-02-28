import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/client.js";

export type Persona = {
  id: string;
  name: string;
  slug: string;
  category: "consumer" | "creator" | "business" | "cityops" | "platform";
  axes?: Record<string, unknown>;
  dimensions?: number;
  tenant_id?: string;
  tenant_name?: string;
  status: "active" | "inactive" | "draft";
  priority?: number;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export function usePersonas(params?: {
  category?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["personas", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set("category", params.category);
      if (params?.status) searchParams.set("status", params.status);
      if (params?.search) searchParams.set("q", params.search);
      const query = searchParams.toString();
      const response = await sdk.client.fetch(
        `/admin/personas${query ? `?${query}` : ""}`,
      );
      return response as { personas: Persona[] };
    },
  });
}

export function useCreatePersona() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Persona>) => {
      const response = await sdk.client.fetch(`/admin/personas`, {
        method: "POST",
        body: data,
      });
      return response as { persona: Persona };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personas"] });
    },
  });
}

export function useUpdatePersona() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Persona> & { id: string }) => {
      const response = await sdk.client.fetch(`/admin/personas/${id}`, {
        method: "PUT",
        body: data,
      });
      return response as { persona: Persona };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personas"] });
    },
  });
}

export function useDeletePersona() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await sdk.client.fetch(`/admin/personas/${id}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personas"] });
    },
  });
}
