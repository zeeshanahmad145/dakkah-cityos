import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/client.js";

export type RegionZoneMapping = {
  id: string;
  residency_zone: "GCC" | "EU" | "MENA" | "APAC" | "AMERICAS" | "GLOBAL";
  medusa_region_id: string;
  country_codes?: string[];
  policies_override?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export function useRegionZones(params?: {
  residency_zone?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["region-zones", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.residency_zone)
        searchParams.set("residency_zone", params.residency_zone);
      if (params?.search) searchParams.set("q", params.search);
      const query = searchParams.toString();
      const response = await sdk.client.fetch(
        `/admin/region-zones${query ? `?${query}` : ""}`,
      );
      return response as { items: RegionZoneMapping[] };
    },
  });
}

export function useCreateRegionZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<RegionZoneMapping>) => {
      const response = await sdk.client.fetch(`/admin/region-zones`, {
        method: "POST",
        body: data,
      });
      return response as { item: RegionZoneMapping };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["region-zones"] });
    },
  });
}

export function useUpdateRegionZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<RegionZoneMapping> & { id: string }) => {
      const response = await sdk.client.fetch(`/admin/region-zones/${id}`, {
        method: "PUT",
        body: data,
      });
      return response as { item: RegionZoneMapping };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["region-zones"] });
    },
  });
}

export function useDeleteRegionZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await sdk.client.fetch(`/admin/region-zones/${id}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["region-zones"] });
    },
  });
}
