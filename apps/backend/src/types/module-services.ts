/**
 * Typed service interfaces for all migrated vertical modules.
 *
 * These replace `container.resolve("module") as unknown as any` with
 * `container.resolve<IModuleService>("module")` throughout routes,
 * subscribers, and workflows.
 *
 * MedusaService() auto-generates CRUD methods following this naming convention:
 *   list<Entity>()  / retrieve<Entity>()
 *   create<Entity>() / update<Entity>() / delete<Entity>()
 */

// ─── Shared base types ─────────────────────────────────────────────────────────

export interface ListConfig {
  skip?: number;
  take?: number;
  order?: Record<string, "ASC" | "DESC">;
}

export type SelectorFilters = Record<string, unknown>;

// ─── Grocery ──────────────────────────────────────────────────────────────────

export interface IFreshProduct {
  id: string;
  tenant_id: string | null;
  organic?: boolean;
  unit_type?: string;
  storage_type?: string;
  shelf_life_days?: number;
  country_of_origin?: string | null;
  batch_number?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IGroceryModuleService {
  listFreshProducts(
    filters?: SelectorFilters,
    config?: ListConfig,
  ): Promise<IFreshProduct[]>;
  retrieveFreshProduct(id: string): Promise<IFreshProduct>;
  createFreshProducts(data: Partial<IFreshProduct>[]): Promise<IFreshProduct[]>;
  updateFreshProducts(
    data: (Partial<IFreshProduct> & { id: string })[],
  ): Promise<IFreshProduct[]>;
  deleteFreshProducts(ids: string[]): Promise<void>;
}

// ─── Freelance ────────────────────────────────────────────────────────────────

export interface IGigListing {
  id: string;
  tenant_id: string;
  seller_id: string;
  category: string;
  skill_level?: string;
  delivery_days?: number;
  revision_count?: number;
  extras?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IFreelanceModuleService {
  listGigListings(
    filters?: SelectorFilters,
    config?: ListConfig,
  ): Promise<IGigListing[]>;
  retrieveGigListing(id: string): Promise<IGigListing>;
  createGigListings(data: Partial<IGigListing>[]): Promise<IGigListing[]>;
  updateGigListings(
    data: (Partial<IGigListing> & { id: string })[],
  ): Promise<IGigListing[]>;
  deleteGigListings(ids: string[]): Promise<void>;
}

// ─── Booking ──────────────────────────────────────────────────────────────────

export interface IServiceProduct {
  id: string;
  tenant_id: string | null;
  service_type:
    | "appointment"
    | "class"
    | "rental"
    | "consultation"
    | "event"
    | "custom";
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  max_capacity: number;
  min_capacity: number;
  min_advance_booking_hours: number;
  max_advance_booking_days: number;
  cancellation_policy_hours: number;
  location_type: "in_person" | "virtual" | "customer_location" | "flexible";
  location_address?: Record<string, unknown> | null;
  virtual_meeting_url?: string | null;
  virtual_meeting_provider?: "zoom" | "google_meet" | "teams" | "custom" | null;
  pricing_type: "fixed" | "per_person" | "per_hour" | "custom";
  required_resources?: unknown | null;
  assigned_providers?: unknown | null;
  inherits_provider_availability: boolean;
  custom_availability_id?: string | null;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface IBookingRecord {
  id: string;
  tenant_id: string;
  customer_id: string;
  order_id?: string | null;
  service_product_id: string;
  scheduled_at?: string | Date | null;
  status: "pending" | "confirmed" | "checked_in" | "completed" | "cancelled";
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IBookingModuleService {
  listServiceProducts(
    filters?: SelectorFilters,
    config?: ListConfig,
  ): Promise<IServiceProduct[]>;
  retrieveServiceProduct(id: string): Promise<IServiceProduct>;
  createServiceProducts(
    data: Partial<IServiceProduct>[],
  ): Promise<IServiceProduct[]>;
  updateServiceProducts(
    data: (Partial<IServiceProduct> & { id: string })[],
  ): Promise<IServiceProduct[]>;
  deleteServiceProducts(ids: string[]): Promise<void>;
  listBookings(
    filters?: SelectorFilters,
    config?: ListConfig,
  ): Promise<IBookingRecord[]>;
  createBookings(data: Partial<IBookingRecord>[]): Promise<IBookingRecord[]>;
  updateBookings(
    data: (Partial<IBookingRecord> & { id: string })[],
  ): Promise<IBookingRecord[]>;
}

// ─── Fitness ──────────────────────────────────────────────────────────────────

export interface IGymMembership {
  id: string;
  tenant_id: string;
  customer_id: string;
  facility_id?: string | null;
  order_id?: string | null;
  membership_type:
    | "basic"
    | "premium"
    | "vip"
    | "student"
    | "corporate"
    | "family";
  status: "pending" | "active" | "frozen" | "expired" | "cancelled";
  start_date: Date;
  end_date?: Date | null;
  auto_renew: boolean;
  freeze_count: number;
  max_freezes: number;
  access_hours?: Record<string, unknown> | null;
  includes?: string[] | null;
  metadata?: Record<string, unknown> | null;
}

export interface IFitnessModuleService {
  listGymMemberships(
    filters?: SelectorFilters,
    config?: ListConfig,
  ): Promise<IGymMembership[]>;
  retrieveGymMembership(id: string): Promise<IGymMembership>;
  createGymMemberships(
    data: Partial<IGymMembership>[],
  ): Promise<IGymMembership[]>;
  updateGymMemberships(
    data: (Partial<IGymMembership> & { id: string })[],
  ): Promise<IGymMembership[]>;
  deleteGymMemberships(ids: string[]): Promise<void>;
}

// ─── Legal ────────────────────────────────────────────────────────────────────

export interface ILegalConsultation {
  id: string;
  tenant_id: string;
  attorney_id: string;
  client_id: string;
  case_id?: string | null;
  order_id?: string | null;
  consultation_type:
    | "initial"
    | "follow_up"
    | "strategy"
    | "settlement"
    | "mediation";
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
  scheduled_at: Date;
  duration_minutes: number;
  is_virtual: boolean;
  virtual_link?: string | null;
  notes?: string | null;
  action_items?: unknown | null;
  completed_at?: Date | null;
  metadata?: Record<string, unknown> | null;
}

export interface ILegalModuleService {
  listLegalConsultations(
    filters?: SelectorFilters,
    config?: ListConfig,
  ): Promise<ILegalConsultation[]>;
  createLegalConsultations(
    data: Partial<ILegalConsultation>[],
  ): Promise<ILegalConsultation[]>;
  updateLegalConsultations(
    data: (Partial<ILegalConsultation> & { id: string })[],
  ): Promise<ILegalConsultation[]>;
  deleteLegalConsultations(ids: string[]): Promise<void>;
}

// ─── Print-on-Demand ──────────────────────────────────────────────────────────

export interface IPodProduct {
  id: string;
  tenant_id?: string | null;
  template_url: string;
  print_provider?: string | null;
  customization_options?: Record<string, unknown> | null;
  base_cost: number;
  metadata?: Record<string, unknown> | null;
}

export interface IPodOrder {
  id: string;
  order_id: string;
  pod_product_id: string;
  customization_data?: Record<string, unknown> | null;
  quantity: number;
  unit_cost: number;
  print_status: "queued" | "printing" | "shipped" | "delivered" | "cancelled";
  tracking_number?: string | null;
}

export interface IPrintOnDemandModuleService {
  listPodProducts(
    filters?: SelectorFilters,
    config?: ListConfig,
  ): Promise<IPodProduct[]>;
  retrievePodProduct(id: string): Promise<IPodProduct>;
  createPodProducts(data: Partial<IPodProduct>[]): Promise<IPodProduct[]>;
  updatePodProducts(
    data: (Partial<IPodProduct> & { id: string })[],
  ): Promise<IPodProduct[]>;
  deletePodProducts(ids: string[]): Promise<void>;
  getProductTemplate(
    id: string,
  ): Promise<{
    templateUrl: string;
    customizationOptions: Record<string, unknown> | null;
  }>;
  submitPodOrder(data: {
    orderId: string;
    podProductId: string;
    customizationData?: Record<string, unknown>;
    quantity?: number;
  }): Promise<IPodOrder>;
  trackPodOrder(
    id: string,
  ): Promise<{
    status: string;
    trackingNumber: string | null;
    estimatedDelivery: string | null;
  }>;
  cancelPodOrder(id: string): Promise<IPodOrder>;
}
