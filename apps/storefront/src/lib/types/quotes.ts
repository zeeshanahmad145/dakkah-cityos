export interface Quote {
  id: string
  display_id?: number
  customer_id: string
  company_id?: string
  status: "draft" | "sent" | "pending" | "accepted" | "declined" | "expired"
  items: QuoteItem[]
  subtotal: number
  tax_total: number
  discount_total: number
  discount?: number
  tax?: number
  total: number
  currency_code: string
  valid_until?: string
  notes?: string
  internal_notes?: string
  created_at: string
  updated_at: string
  accepted_at?: string
  declined_at?: string
  expired_at?: string
  customer?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
}

export interface QuoteItem {
  id: string
  quote_id: string
  product_id?: string
  variant_id?: string
  title: string
  name?: string
  description?: string
  quantity: number
  unit_price: number
  total: number
  thumbnail?: string
}

export interface QuoteRequest {
  items: {
    product_id?: string
    variant_id?: string
    title?: string
    quantity: number
    notes?: string
  }[]
  notes?: string
  requested_delivery_date?: string
  shipping_address_id?: string
}

export interface QuoteFilters {
  status?: Quote["status"][]
  created_after?: string
  created_before?: string
}
