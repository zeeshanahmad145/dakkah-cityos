export interface SubscriptionPlan {
  id: string
  tenant_id?: string
  name: string
  handle: string
  description?: string
  status: "draft" | "active" | "archived"
  billing_interval: "monthly" | "yearly" | "quarterly" | "weekly"
  billing_interval_count: number
  price?: number
  currency_code: string
  setup_fee?: number
  trial_period_days: number
  trial_days?: number
  features?: string[] | Record<string, unknown>
  limits?: Record<string, unknown>
  included_products?: string[]
  sort_order: number
  stripe_price_id?: string
  stripe_product_id?: string
  is_popular?: boolean
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  customer_id: string
  tenant_id: string
  store_id?: string
  plan_id?: string
  plan?: SubscriptionPlan
  status: SubscriptionStatus
  start_date?: string
  end_date?: string
  current_period_start?: string
  current_period_end?: string
  trial_start?: string
  trial_end?: string
  canceled_at?: string
  paused_until?: string
  pause_end?: string
  billing_interval: "monthly" | "yearly" | "quarterly" | "weekly"
  billing_interval_count: number
  billing_anchor_day?: number
  payment_collection_method: "charge_automatically" | "send_invoice"
  payment_provider_id?: string
  payment_method_id?: string
  currency_code: string
  max_retry_attempts: number
  retry_count: number
  last_retry_at?: string
  next_retry_at?: string
  next_billing_date?: string
  items: SubscriptionItem[]
  payment_method?: PaymentMethod
  invoices?: SubscriptionInvoice[]
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "paused"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"

export interface SubscriptionItem {
  id: string
  subscription_id: string
  product_id: string
  variant_id: string
  product_title: string
  variant_title?: string
  quantity: number
  billing_interval?: string
  billing_interval_count?: number
  tenant_id?: string
  price?: number
  product?: {
    id: string
    title: string
    thumbnail?: string
    handle: string
  }
  metadata?: Record<string, unknown>
}

export interface SubscriptionInvoice {
  id: string
  subscription_id: string
  amount: number
  currency_code: string
  status: "draft" | "open" | "paid" | "void" | "uncollectible"
  due_date: string
  paid_at?: string
  invoice_url?: string
  created_at: string
}

export interface PaymentMethod {
  id: string
  type: "card" | "bank_account" | "paypal"
  last_four?: string
  brand?: string
  exp_month?: number
  exp_year?: number
  is_default: boolean
}

export interface SubscriptionCheckoutData {
  plan_id: string
  variant_id?: string
  quantity?: number
  promo_code?: string
  billing_address?: BillingAddress
  payment_method_id?: string
}

export interface BillingAddress {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  province?: string
  postal_code: string
  country_code: string
  phone?: string
}

export interface BillingCycle {
  id: string
  subscription_id: string
  tenant_id: string
  period_start: string
  period_end: string
  billing_date: string
  status: "upcoming" | "current" | "completed" | "failed" | "pending" | "processing"
  order_id?: string
  payment_collection_id?: string
  attempt_count: number
  last_attempt_at?: string
  next_attempt_at?: string
  completed_at?: string
  failed_at?: string
  failure_reason?: string
  failure_code?: string
  amount?: number
  currency_code?: string
  invoice_id?: string
  paid_at?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface SubscriptionEvent {
  id: string
  subscription_id: string
  tenant_id?: string
  event_type:
    | "created"
    | "activated"
    | "paused"
    | "resumed"
    | "cancelled"
    | "renewed"
    | "plan_changed"
    | "payment_failed"
    | "payment_succeeded"
    | "trial_started"
    | "trial_ended"
  event_data?: Record<string, unknown>
  triggered_by: "system" | "customer" | "admin" | "webhook"
  triggered_by_id?: string
  occurred_at: string
  billing_cycle_id?: string
  order_id?: string
  description?: string
  details?: Record<string, unknown>
  metadata?: Record<string, unknown>
  created_at: string
}

export interface SubscriptionPause {
  id: string
  subscription_id: string
  paused_at: string
  resume_at?: string
  resumed_at?: string
  reason?: string
  pause_type: "immediate" | "end_of_period" | "scheduled"
  extends_billing_period: boolean
  days_paused: number
  status?: "active" | "scheduled" | "completed" | "cancelled"
  metadata?: Record<string, unknown>
  created_at: string
}

export interface SubscriptionDiscount {
  id: string
  tenant_id?: string
  code: string
  name: string
  discount_type: "percentage" | "fixed"
  discount_value?: number
  duration: "once" | "repeating" | "forever"
  duration_in_months?: number
  applicable_plans?: string[]
  max_redemptions?: number
  current_redemptions: number
  max_redemptions_per_customer: number
  starts_at?: string
  ends_at?: string
  is_active: boolean
  stripe_coupon_id?: string
  subscription_id?: string
  plan_id?: string
  description?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface SubscriptionPlansResponse {
  plans: SubscriptionPlan[]
  count: number
}

export interface SubscriptionsResponse {
  subscriptions: Subscription[]
  count: number
}

export interface SubscriptionResponse {
  subscription: Subscription
}
