import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/client.js";

export type CmsPage = {
  id: string;
  title: string;
  slug: string;
  locale: string;
  status: "draft" | "published" | "archived";
  template?: string;
  layout: any[];
  seo_title?: string;
  seo_description?: string;
  seo_image?: string;
  node_id?: string;
  published_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CmsNavigation = {
  id: string;
  name: string;
  handle: string;
  items: CmsNavigationItem[];
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CmsNavigationItem = {
  id: string;
  label: string;
  url?: string;
  page_id?: string;
  parent_id?: string;
  position: number;
  children?: CmsNavigationItem[];
};

export function useCmsPages(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ["cms-pages", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      if (params?.search) searchParams.set("q", params.search);

      const query = searchParams.toString();
      const response = await sdk.client.fetch(
        `/admin/cms/pages${query ? `?${query}` : ""}`,
      );
      return response as { pages: CmsPage[] };
    },
  });
}

export function useCmsNavigation(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: ["cms-navigation", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.is_active !== undefined)
        searchParams.set("is_active", String(params.is_active));

      const query = searchParams.toString();
      const response = await sdk.client.fetch(
        `/admin/cms/navigations${query ? `?${query}` : ""}`,
      );
      return response as { navigations: CmsNavigation[] };
    },
  });
}

export function useCreateCmsPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CmsPage>) => {
      const response = await sdk.client.fetch(`/admin/cms/pages`, {
        method: "POST",
        body: data,
      });
      return response as { page: CmsPage };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
    },
  });
}

export function useUpdateCmsPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CmsPage> & { id: string }) => {
      const response = await sdk.client.fetch(`/admin/cms/pages/${id}`, {
        method: "PUT",
        body: data,
      });
      return response as { page: CmsPage };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
    },
  });
}
