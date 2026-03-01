import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { useQuery } from "@tanstack/react-query"
import { normalizeItem } from "@/lib/utils/normalize-item"

export interface MembershipBenefit {
  id: string
  title: string
  description?: string
  icon?: string
  included: boolean
  value?: string
}

export interface MembershipTier {
  id: string
  name: string
  description?: string
  price: { amount: number; currencyCode: string }
  billingPeriod: "monthly" | "yearly" | "lifetime"
  benefits: MembershipBenefit[]
  isPopular?: boolean
  isCurrent?: boolean
  features?: Record<string, string | boolean>
  maxMembers?: number
  trialDays?: number
}

export interface UserMembership {
  id: string
  tierId: string
  tierName: string
  status: "active" | "expired" | "cancelled" | "paused"
  startDate: string
  expiresAt?: string
  renewalDate?: string
  benefits: MembershipBenefit[]
}

async function fetchApi<T>(path: string): Promise<T> {
  const baseUrl = getServerBaseUrl()
  const response = await fetchWithTimeout(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
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

export function useMemberships() {
  return useQuery({
    queryKey: ["memberships"],
    queryFn: async () => {
      const response = await fetchApi<{
        items: MembershipTier[]
        count: number
      }>("/store/memberships")
      return response.items
    },
    placeholderData: [],
  })
}

export function useMembership(membershipId: string) {
  return useQuery({
    queryKey: ["membership", membershipId],
    queryFn: async () => {
      const response = await fetchApi<{ item: MembershipTier }>(
        `/store/memberships/${membershipId}`,
      )
      return normalizeItem(response.item)
    },
    enabled: !!membershipId,
  })
}

export function useUserMembership() {
  return useQuery({
    queryKey: ["user-membership"],
    queryFn: async () => {
      const response = await fetchApi<{ item: UserMembership | null }>(
        "/store/memberships?customer_id=me",
      )
      return response.item
    },
  })
}
