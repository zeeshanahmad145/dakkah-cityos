import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface WalletBalance {
  available: number
  pending: number
  currency: string
  lastUpdated: string
}

export interface WalletTransaction {
  id: string
  type: "credit" | "debit" | "transfer" | "refund" | "top-up"
  amount: number
  currency: string
  description: string
  timestamp: string
  status: "completed" | "pending" | "failed"
  counterparty?: string
  reference?: string
}

export interface GiftCard {
  id: string
  code: string
  balance: number
  originalAmount: number
  currency: string
  expiresAt?: string
  status: "active" | "redeemed" | "expired" | "disabled"
  recipientEmail?: string
  senderName?: string
  message?: string
}

export interface StoreCreditBalance {
  available: number
  currency: string
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

export const paymentKeys = {
  all: ["payments"] as const,
  wallet: () => [...paymentKeys.all, "wallet"] as const,
  walletBalance: () => [...paymentKeys.wallet(), "balance"] as const,
  walletTransactions: (page?: number) =>
    [...paymentKeys.wallet(), "transactions", page] as const,
  giftCards: () => [...paymentKeys.all, "gift-cards"] as const,
  storeCredit: () => [...paymentKeys.all, "store-credit"] as const,
}

export function useWalletBalance() {
  return useQuery({
    queryKey: paymentKeys.walletBalance(),
    queryFn: async () => {
      try {
        const response = await fetchApi<{ wallet: WalletBalance }>(
          "/store/wallet/balance",
        )
        return response.wallet
      } catch {
        return {
          available: 0,
          pending: 0,
          currency: "USD",
          lastUpdated: new Date().toISOString(),
        } as WalletBalance
      }
    },
    staleTime: 30 * 1000,
  })
}

export function useWalletTransactions(page: number = 1) {
  return useQuery({
    queryKey: paymentKeys.walletTransactions(page),
    queryFn: async () => {
      try {
        const response = await fetchApi<{
          transactions: WalletTransaction[]
          hasMore: boolean
          total: number
        }>(`/store/wallet/transactions?page=${page}&limit=10`)
        return response
      } catch {
        return {
          transactions: [] as WalletTransaction[],
          hasMore: false,
          total: 0,
        }
      }
    },
    staleTime: 30 * 1000,
  })
}

export function useGiftCards() {
  return useQuery({
    queryKey: paymentKeys.giftCards(),
    queryFn: async () => {
      try {
        const response = await fetchApi<{ giftCards: GiftCard[] }>(
          "/store/gift-cards",
        )
        return response.giftCards
      } catch {
        return [] as GiftCard[]
      }
    },
    staleTime: 60 * 1000,
  })
}

export function useStoreCreditBalance() {
  return useQuery({
    queryKey: paymentKeys.storeCredit(),
    queryFn: async () => {
      try {
        const response = await fetchApi<{ credit: StoreCreditBalance }>(
          "/store/credit/balance",
        )
        return response.credit
      } catch {
        return { available: 0, currency: "USD" } as StoreCreditBalance
      }
    },
    staleTime: 30 * 1000,
  })
}

export function usePurchaseGiftCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      amount: number
      recipientEmail: string
      message?: string
      senderName?: string
    }) => {
      return fetchApi<{ giftCard: GiftCard }>("/store/gift-cards", {
        method: "POST",
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.giftCards() })
    },
  })
}

export function useApplyCoupon() {
  return useMutation({
    mutationFn: async (code: string) => {
      return fetchApi<{
        discount: { amount: number; type: string; code: string }
      }>("/store/cart/coupons", {
        method: "POST",
        body: JSON.stringify({ code }),
      })
    },
  })
}

export function useRemoveCoupon() {
  return useMutation({
    mutationFn: async (code: string) => {
      return fetchApi<void>(`/store/cart/coupons/${code}`, {
        method: "DELETE",
      })
    },
  })
}

export function useTopUpWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (amount: number) => {
      return fetchApi<{ wallet: WalletBalance }>("/store/wallet/top-up", {
        method: "POST",
        body: JSON.stringify({ amount }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.wallet() })
    },
  })
}
