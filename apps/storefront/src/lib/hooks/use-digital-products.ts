import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/utils/query-keys"
import { normalizeItem } from "@/lib/utils/normalize-item"

export interface DigitalProduct {
  id: string
  title: string
  description?: string
  thumbnail?: string
  price: number
  currency_code: string
  file_type: string
  file_size: string
  format?: string
  preview_url?: string
  rating?: { average: number; count: number }
  category?: string
  vendor_id?: string
  vendor_name?: string
  created_at: string
  metadata?: Record<string, unknown>
}

export interface DownloadItem {
  id: string
  product_id: string
  title: string
  thumbnail?: string
  purchase_date: string
  file_type: string
  file_size: string
  download_url: string
  downloads_remaining?: number
  expires_at?: string
  license_key?: string
}

export interface DigitalProductFilters {
  category?: string
  search?: string
  sort?: string
  limit?: number
  offset?: number
}

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

export function useDigitalProducts(filters?: DigitalProductFilters) {
  return useQuery({
    queryKey: queryKeys.digitalProducts.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.category) params.set("category", filters.category)
      if (filters?.search) params.set("q", filters.search)
      if (filters?.sort) params.set("sort", filters.sort)
      if (filters?.limit) params.set("limit", filters.limit.toString())
      if (filters?.offset) params.set("offset", filters.offset.toString())

      const qs = params.toString()
      const response = await fetchApi<{
        digital_products: DigitalProduct[]
        count: number
      }>(`/store/digital-products${qs ? `?${qs}` : ""}`)
      return response
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useDigitalProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.digitalProducts.detail(id),
    queryFn: async () => {
      const response = await fetchApi<{ digital_product: DigitalProduct }>(
        `/store/digital-products/${id}`,
      )
      return normalizeItem(response.digital_product)
    },
    enabled: !!id,
  })
}

export function useMyDownloads() {
  return useQuery({
    queryKey: queryKeys.digitalProducts.downloads(),
    queryFn: async () => {
      const response = await fetchApi<{ downloads: DownloadItem[] }>(
        `/store/digital-products/downloads`,
      )
      return response.downloads || []
    },
  })
}
