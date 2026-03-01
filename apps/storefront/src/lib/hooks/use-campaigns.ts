import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/utils/query-keys"
import { normalizeItem } from "@/lib/utils/normalize-item"

export interface Campaign {
  id: string
  title: string
  description?: string
  thumbnail?: string
  goal_amount: number
  raised_amount: number
  currency_code: string
  backers_count: number
  days_remaining: number
  ends_at: string
  status: "active" | "funded" | "ended" | "cancelled"
  category?: string
  creator_name?: string
  creator_avatar?: string
  reward_tiers?: RewardTier[]
  updates?: CampaignUpdate[]
  metadata?: Record<string, unknown>
}

export interface RewardTier {
  id: string
  title: string
  description?: string
  pledge_amount: number
  currency_code: string
  estimated_delivery?: string
  limited_quantity?: number
  claimed?: number
  includes?: string[]
}

export interface CampaignUpdate {
  id: string
  title: string
  content: string
  created_at: string
}

export interface FlashSale {
  id: string
  title: string
  thumbnail?: string
  original_price: number
  sale_price: number
  currency_code: string
  discount_percentage: number
  ends_at: string
  quantity_total?: number
  quantity_sold?: number
}

export interface Bundle {
  id: string
  title: string
  description?: string
  thumbnail?: string
  items: BundleItem[]
  total_price: number
  original_price: number
  savings_amount: number
  currency_code: string
}

export interface BundleItem {
  id: string
  title: string
  thumbnail?: string
  price: number
  currency_code: string
  required: boolean
}

export interface WishlistItem {
  id: string
  product_id: string
  title: string
  thumbnail?: string
  price: number
  currency_code: string
  in_stock: boolean
  added_at: string
}

export interface CampaignFilters {
  category?: string
  status?: string
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

export function useCampaigns(filters?: CampaignFilters) {
  return useQuery({
    queryKey: queryKeys.campaigns.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.category) params.set("category", filters.category)
      if (filters?.status) params.set("status", filters.status)
      if (filters?.search) params.set("q", filters.search)
      if (filters?.sort) params.set("sort", filters.sort)
      if (filters?.limit) params.set("limit", filters.limit.toString())
      if (filters?.offset) params.set("offset", filters.offset.toString())

      const qs = params.toString()
      const response = await fetchApi<{ campaigns: Campaign[]; count: number }>(
        `/store/crowdfunding${qs ? `?${qs}` : ""}`,
      )
      return response
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: queryKeys.campaigns.detail(id),
    queryFn: async () => {
      const response = await fetchApi<{ campaign: Campaign }>(
        `/store/crowdfunding/${id}`,
      )
      return normalizeItem(response.campaign)
    },
    enabled: !!id,
  })
}

export function useFlashSales() {
  return useQuery({
    queryKey: queryKeys.flashSales.all,
    queryFn: async () => {
      const response = await fetchApi<{
        flash_sales: FlashSale[]
        count: number
      }>(`/store/flash-sales`)
      return response
    },
    staleTime: 30 * 1000,
  })
}

export function useBundles() {
  return useQuery({
    queryKey: queryKeys.bundles.all,
    queryFn: async () => {
      const response = await fetchApi<{ bundles: Bundle[]; count: number }>(
        `/store/bundles`,
      )
      return response
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useWishlist() {
  return useQuery({
    queryKey: queryKeys.wishlist.all,
    queryFn: async () => {
      const response = await fetchApi<{ items: WishlistItem[] }>(
        `/store/wishlist`,
      )
      return response.items || []
    },
  })
}
