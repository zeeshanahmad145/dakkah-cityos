/**
 * Admin API utilities for custom modules
 */

// Generic API response type
interface ApiResponse<T> {
  data: T;
  count?: number;
  offset?: number;
  limit?: number;
}

// Company types
export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tax_id?: string;
  status: "pending" | "active" | "suspended" | "inactive";
  tier: "bronze" | "silver" | "gold" | "platinum";
  credit_limit: number;
  available_credit: number;
  payment_terms_days: number;
  requires_po: boolean;
  auto_approve_under: number;
  billing_address?: Record<string, any>;
  shipping_address?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CompanyUser {
  id: string;
  company_id: string;
  customer_id: string;
  role: "owner" | "admin" | "buyer" | "viewer";
  is_primary: boolean;
  can_place_orders: boolean;
  spending_limit?: number;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  company_id: string;
  customer_id: string;
  po_number: string;
  status:
    | "draft"
    | "pending_approval"
    | "approved"
    | "rejected"
    | "partially_fulfilled"
    | "fulfilled"
    | "cancelled"
    | "closed";
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  notes?: string;
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  discount_total: number;
  total: number;
  currency_code: string;
  items: PurchaseOrderItem[];
  created_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id?: string;
  variant_id?: string;
  sku?: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
  fulfilled_quantity: number;
}

export interface PaymentTerms {
  id: string;
  company_id: string;
  name: string;
  net_days: number;
  discount_percentage: number;
  discount_days: number;
  is_default: boolean;
  is_active: boolean;
}

export interface TaxExemption {
  id: string;
  company_id: string;
  certificate_number: string;
  state?: string;
  country: string;
  exemption_type: "resale" | "nonprofit" | "government" | "other";
  expires_at?: string;
  certificate_url?: string;
  verified: boolean;
  verified_at?: string;
  verified_by?: string;
}

// Vendor types
export interface Vendor {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  status: "pending" | "active" | "suspended" | "inactive";
  tier: "bronze" | "silver" | "gold" | "platinum";
  commission_rate: number;
  min_payout_amount: number;
  payout_schedule: "weekly" | "biweekly" | "monthly";
  stripe_account_id?: string;
  stripe_onboarding_complete: boolean;
  kyc_status: "not_started" | "pending" | "verified" | "rejected";
  business_type?: string;
  tax_id?: string;
  bank_account?: Record<string, any>;
  address?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface VendorProduct {
  id: string;
  vendor_id: string;
  product_id: string;
  commission_override?: number;
  is_active: boolean;
}

export interface VendorOrder {
  id: string;
  vendor_id: string;
  order_id: string;
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
  subtotal: number;
  commission_amount: number;
  net_amount: number;
  shipped_at?: string;
  delivered_at?: string;
}

// Subscription types
export interface SubscriptionPlan {
  id: string;
  name: string;
  handle: string;
  description?: string;
  billing_interval: "day" | "week" | "month" | "year";
  billing_interval_count: number;
  price: number;
  currency_code: string;
  trial_days: number;
  setup_fee: number;
  is_active: boolean;
  sort_order: number;
  features?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface Subscription {
  id: string;
  customer_id: string;
  plan_id?: string;
  status:
    | "trialing"
    | "active"
    | "paused"
    | "past_due"
    | "cancelled"
    | "expired";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  trial_start?: string;
  trial_end?: string;
  paused_at?: string;
  resume_at?: string;
  stripe_subscription_id?: string;
  metadata?: Record<string, any>;
  items: SubscriptionItem[];
}

export interface SubscriptionItem {
  id: string;
  subscription_id: string;
  product_id?: string;
  variant_id?: string;
  price_id?: string;
  quantity: number;
  unit_price: number;
  currency_code: string;
}

// Booking types
export interface ServiceProvider {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  is_active: boolean;
  color?: string;
  timezone: string;
  metadata?: Record<string, any>;
}

export interface ServiceProduct {
  id: string;
  product_id: string;
  duration_minutes: number;
  buffer_before: number;
  buffer_after: number;
  max_capacity: number;
  requires_confirmation: boolean;
  cancellation_hours: number;
  location_type: "in_person" | "virtual" | "both";
  location_details?: string;
  is_active: boolean;
}

export interface Booking {
  id: string;
  customer_id?: string;
  provider_id?: string;
  service_product_id?: string;
  order_id?: string;
  status:
    | "pending"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show";
  starts_at: string;
  ends_at: string;
  timezone: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
  internal_notes?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  confirmed_at?: string;
  completed_at?: string;
}

export interface Availability {
  id: string;
  provider_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

// Tenant types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: "trialing" | "active" | "suspended" | "cancelled";
  plan: "free" | "starter" | "professional" | "enterprise";
  owner_email: string;
  owner_name?: string;
  settings?: Record<string, any>;
  features?: Record<string, any>;
  trial_ends_at?: string;
  created_at: string;
}

export interface TenantBilling {
  id: string;
  tenant_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_plan: string;
  billing_email: string;
  billing_interval: "monthly" | "yearly";
  monthly_amount: number;
  currency_code: string;
  next_billing_date?: string;
  payment_method_last4?: string;
  payment_method_brand?: string;
}

// Quote types
export interface Quote {
  id: string;
  customer_id: string;
  company_id?: string;
  status:
    | "draft"
    | "sent"
    | "viewed"
    | "accepted"
    | "rejected"
    | "expired"
    | "converted";
  quote_number: string;
  valid_until?: string;
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  converted_order_id?: string;
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  discount_total: number;
  total: number;
  currency_code: string;
  notes?: string;
  internal_notes?: string;
  items: QuoteItem[];
  created_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id?: string;
  variant_id?: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  original_price?: number;
  discount_amount: number;
  total: number;
}

// API functions
export const companyApi = {
  list: async (params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }) => {
    const response = await fetch(
      `/admin/companies?${new URLSearchParams(Object.fromEntries(Object.entries(params||{}).filter(([,v])=>v!==undefined).map(([k,v])=>[k,String(v)])))}`,
    );
    return response.json() as Promise<ApiResponse<Company[]>>;
  },
  get: async (id: string) => {
    const response = await fetch(`/admin/companies/${id}`);
    return response.json() as Promise<{ company: Company }>;
  },
  create: async (data: Partial<Company>) => {
    const response = await fetch("/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<{ company: Company }>;
  },
  update: async (id: string, data: Partial<Company>) => {
    const response = await fetch(`/admin/companies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<{ company: Company }>;
  },
};

export const vendorApi = {
  list: async (params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }) => {
    const response = await fetch(
      `/admin/vendors?${new URLSearchParams(Object.fromEntries(Object.entries(params||{}).filter(([,v])=>v!==undefined).map(([k,v])=>[k,String(v)])))}`,
    );
    return response.json() as Promise<ApiResponse<Vendor[]>>;
  },
  get: async (id: string) => {
    const response = await fetch(`/admin/vendors/${id}`);
    return response.json() as Promise<{ vendor: Vendor }>;
  },
  approve: async (id: string) => {
    const response = await fetch(`/admin/vendors/${id}/approve`, {
      method: "POST",
    });
    return response.json() as Promise<{ vendor: Vendor }>;
  },
  reject: async (id: string, reason: string) => {
    const response = await fetch(`/admin/vendors/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    return response.json() as Promise<{ vendor: Vendor }>;
  },
};

export const subscriptionApi = {
  list: async (params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }) => {
    const response = await fetch(
      `/admin/subscriptions?${new URLSearchParams(Object.fromEntries(Object.entries(params||{}).filter(([,v])=>v!==undefined).map(([k,v])=>[k,String(v)])))}`,
    );
    return response.json() as Promise<ApiResponse<Subscription[]>>;
  },
  get: async (id: string) => {
    const response = await fetch(`/admin/subscriptions/${id}`);
    return response.json() as Promise<{ subscription: Subscription }>;
  },
  plans: {
    list: async () => {
      const response = await fetch("/admin/subscription-plans");
      return response.json() as Promise<ApiResponse<SubscriptionPlan[]>>;
    },
    create: async (data: Partial<SubscriptionPlan>) => {
      const response = await fetch("/admin/subscription-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json() as Promise<{ plan: SubscriptionPlan }>;
    },
  },
};

export const bookingApi = {
  list: async (params?: {
    limit?: number;
    offset?: number;
    status?: string;
    provider_id?: string;
  }) => {
    const response = await fetch(
      `/admin/bookings?${new URLSearchParams(Object.fromEntries(Object.entries(params||{}).filter(([,v])=>v!==undefined).map(([k,v])=>[k,String(v)])))}`,
    );
    return response.json() as Promise<ApiResponse<Booking[]>>;
  },
  get: async (id: string) => {
    const response = await fetch(`/admin/bookings/${id}`);
    return response.json() as Promise<{ booking: Booking }>;
  },
  providers: {
    list: async () => {
      const response = await fetch("/admin/service-providers");
      return response.json() as Promise<ApiResponse<ServiceProvider[]>>;
    },
  },
};

export const tenantApi = {
  list: async (params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }) => {
    const response = await fetch(
      `/admin/tenants?${new URLSearchParams(Object.fromEntries(Object.entries(params||{}).filter(([,v])=>v!==undefined).map(([k,v])=>[k,String(v)])))}`,
    );
    return response.json() as Promise<ApiResponse<Tenant[]>>;
  },
  get: async (id: string) => {
    const response = await fetch(`/admin/tenants/${id}`);
    return response.json() as Promise<{ tenant: Tenant }>;
  },
};

export const quoteApi = {
  list: async (params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }) => {
    const response = await fetch(
      `/admin/quotes?${new URLSearchParams(Object.fromEntries(Object.entries(params||{}).filter(([,v])=>v!==undefined).map(([k,v])=>[k,String(v)])))}`,
    );
    return response.json() as Promise<ApiResponse<Quote[]>>;
  },
  get: async (id: string) => {
    const response = await fetch(`/admin/quotes/${id}`);
    return response.json() as Promise<{ quote: Quote }>;
  },
};

export const purchaseOrderApi = {
  list: async (params?: {
    limit?: number;
    offset?: number;
    status?: string;
    company_id?: string;
  }) => {
    const response = await fetch(
      `/admin/purchase-orders?${new URLSearchParams(Object.fromEntries(Object.entries(params||{}).filter(([,v])=>v!==undefined).map(([k,v])=>[k,String(v)])))}`,
    );
    return response.json() as Promise<ApiResponse<PurchaseOrder[]>>;
  },
  get: async (id: string) => {
    const response = await fetch(`/admin/purchase-orders/${id}`);
    return response.json() as Promise<{ purchase_order: PurchaseOrder }>;
  },
  approve: async (id: string) => {
    const response = await fetch(`/admin/purchase-orders/${id}/approve`, {
      method: "POST",
    });
    return response.json() as Promise<{ purchase_order: PurchaseOrder }>;
  },
  reject: async (id: string, reason: string) => {
    const response = await fetch(`/admin/purchase-orders/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    return response.json() as Promise<{ purchase_order: PurchaseOrder }>;
  },
};

