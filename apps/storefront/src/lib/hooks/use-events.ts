import { useQuery } from "@tanstack/react-query"
import { normalizeItem } from "@/lib/utils/normalize-item"
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"

async function fetchEvents(filters?: Record<string, unknown>) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value))
      }
    })
  }
  const queryStr = params.toString()
  const url = `/store/events${queryStr ? `?${queryStr}` : ""}`

  const baseUrl = getServerBaseUrl()
  const fullUrl = `${baseUrl}${url}`

  const resp = await fetchWithTimeout(fullUrl, {
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": getMedusaPublishableKey(),
    },
  })
  if (!resp.ok) throw new Error(`Events API error: ${resp.status}`)
  const data = await resp.json()
  return data?.items || []
}

export function useEvents(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["events", filters],
    queryFn: () => fetchEvents(filters),
    staleTime: 30000,
    retry: 1,
  })
}

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(
        `${baseUrl}/store/events/${eventId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": getMedusaPublishableKey(),
          },
        },
      )
      if (!resp.ok) throw new Error(`Event API error: ${resp.status}`)
      const data = await resp.json()
      return normalizeItem(data)
    },
    enabled: !!eventId,
  })
}
