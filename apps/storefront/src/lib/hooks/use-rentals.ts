import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { useQuery } from "@tanstack/react-query"
import { normalizeItem } from "@/lib/utils/normalize-item"

export interface RentalItem {
  id: string
  title: string
  description?: string
  thumbnail?: string
  images?: string[]
  pricePerDay: { amount: number; currencyCode: string }
  pricePerWeek?: { amount: number; currencyCode: string }
  pricePerMonth?: { amount: number; currencyCode: string }
  deposit?: { amount: number; currencyCode: string }
  insurance?: { amount: number; currencyCode: string }
  condition?: "new" | "like-new" | "good" | "fair"
  rating?: { average: number; count: number }
  location?: string
  availableFrom?: string
  availableUntil?: string
  bookedDates?: string[]
  rentalType?: string
  vendor?: { id: string; name: string }
  terms?: string
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

export function useRentals(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["rentals", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.rental_type)
        params.set("rental_type", String(filters.rental_type))
      if (filters?.limit) params.set("limit", String(filters.limit))
      if (filters?.offset) params.set("offset", String(filters.offset))
      const qs = params.toString()
      const response = await fetchApi<{ items: RentalItem[]; count: number }>(
        `/store/rentals${qs ? `?${qs}` : ""}`,
      )
      return response.items
    },
    placeholderData: [],
  })
}

export function useRental(rentalId: string) {
  return useQuery({
    queryKey: ["rental", rentalId],
    queryFn: async () => {
      const response = await fetchApi<{ item: RentalItem }>(
        `/store/rentals/${rentalId}`,
      )
      return normalizeItem(response.item)
    },
    enabled: !!rentalId,
  })
}
