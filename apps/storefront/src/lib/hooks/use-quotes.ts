import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"

export interface QuoteItem {
  id: string
  quote_id: string
  title: string
  description?: string
  sku?: string
  quantity: number
  unit_price?: number
  total?: number
  notes?: string
}

export interface Quote {
  id: string
  quote_number?: string
  company_id?: string
  customer_id?: string
  status: string
  valid_until?: string
  currency_code?: string
  subtotal?: number
  tax?: number
  discount?: number
  total?: number
  notes?: string
  items?: QuoteItem[]
  created_at: string
  updated_at?: string
}

export function useQuotes() {
  return useQuery({
    queryKey: ["quotes", "list"],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ quotes: Quote[]; count: number }>(
        "/store/quotes",
        { credentials: "include" }
      )
      return response
    },
  })
}

export function useQuote(quoteId: string) {
  return useQuery({
    queryKey: ["quotes", "detail", quoteId],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ quote: Quote }>(
        `/store/quotes/${quoteId}`,
        { credentials: "include" }
      )
      return response.quote
    },
    enabled: !!quoteId,
  })
}
