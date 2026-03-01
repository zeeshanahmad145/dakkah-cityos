/**
 * Typed container resolver utilities
 *
 * Provides type-safe wrappers around Medusa's IoC container.resolve() so
 * subscribers, middlewares, and workflows can avoid `container.resolve(...) as unknown as any`.
 *
 * Usage:
 *   import { resolveService } from "../lib/typed-container"
 *   const logger = resolveService<ILogger>(container, "logger")
 */

/** Generic typed resolve — T must be the interface the service satisfies */
export function resolveService<T>(
  container: { resolve(key: string): unknown },
  key: string,
): T {
  return container.resolve(key) as unknown as T;
}

// ─── Common Medusa Core Interfaces ───────────────────────────────────────────

export interface ILogger {
  info(msg: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  debug(msg: string, ...args: unknown[]): void;
}

export interface IEventBus {
  emit(event: string, data: Record<string, unknown>): Promise<void>;
  publish(event: string, data: Record<string, unknown>): Promise<void>;
}

export interface IOrderService {
  listOrders(
    filters: Record<string, unknown>,
    config?: { relations?: string[]; take?: number; skip?: number },
  ): Promise<Array<Record<string, unknown>>>;
  retrieveOrder(
    id: string,
    config?: { relations?: string[] },
  ): Promise<Record<string, unknown>>;
  updateOrders(
    id: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
}

export interface IProductService {
  listProducts(
    filters?: Record<string, unknown>,
    config?: Record<string, unknown>,
  ): Promise<Array<Record<string, unknown>>>;
  retrieveProduct(id: string): Promise<Record<string, unknown>>;
}

export interface ICustomerService {
  retrieveCustomer(id: string): Promise<Record<string, unknown>>;
  listCustomers(
    filters?: Record<string, unknown>,
  ): Promise<Array<Record<string, unknown>>>;
}

// ─── Domain Module Service Interfaces ───────────────────────────────────────

export interface IRestaurantService {
  createKitchenOrders(data: Record<string, unknown>[]): Promise<void>;
  createMenuItems(data: Record<string, unknown>[]): Promise<unknown>;
  listMenuItems(
    filters?: Record<string, unknown>,
  ): Promise<Array<Record<string, unknown>>>;
}

export interface ITravelService {
  createReservations(data: Record<string, unknown>[]): Promise<void>;
  listTravelListings(
    filters?: Record<string, unknown>,
  ): Promise<Array<Record<string, unknown>>>;
}

export interface ICrowdfundingService {
  createPledges(data: Record<string, unknown>[]): Promise<void>;
  listCrowdfundCampaigns(
    filters: Record<string, unknown>,
    config?: Record<string, unknown>,
  ): Promise<Array<Record<string, unknown>>>;
  updateCrowdfundCampaigns(data: Record<string, unknown>[]): Promise<void>;
}

export interface IInsuranceService {
  createInsPolicies(data: Record<string, unknown>[]): Promise<void>;
  listInsPlans(
    filters?: Record<string, unknown>,
  ): Promise<Array<Record<string, unknown>>>;
}

export interface ISubscriptionService {
  createSubscriptions(data: Record<string, unknown>[]): Promise<void>;
  listSubscriptions(
    filters?: Record<string, unknown>,
  ): Promise<Array<Record<string, unknown>>>;
}

export interface IVendorService {
  retrieveVendor(id: string): Promise<Record<string, unknown>>;
  listVendors(
    filters?: Record<string, unknown>,
  ): Promise<Array<Record<string, unknown>>>;
  updateVendors(
    update: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  createVendorOrders(
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  createVendorOrderItems(
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
}

export interface ICompanyService {
  retrieveCompany(id: string): Promise<Record<string, unknown>>;
  updateCompanies(
    update: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  listCompanyUsers(
    filters?: Record<string, unknown>,
  ): Promise<Array<Record<string, unknown>>>;
}

export interface ITenantService {
  retrieveTenant(id: string): Promise<Record<string, unknown>>;
  listTenants(
    filters?: Record<string, unknown>,
  ): Promise<Array<Record<string, unknown>>>;
  updateTenants(
    update: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
}
