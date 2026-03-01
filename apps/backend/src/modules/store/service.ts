import { MedusaService } from "@medusajs/framework/utils";
import Store from "./models/store";

/**
 * Store Module Service
 * Manages store operations within tenants
 */
class StoreModuleService extends MedusaService({
  Store,
}) {
  /**
   * Retrieve stores by tenant
   */
  async listStoresByTenant(
    tenant_id: string,
    filters?: Record<string, unknown>,
  ) {
    return await this.listStores({
      tenant_id,
      ...filters,
    }) as any;
  }

  /**
   * Retrieve store by subdomain
   */
  async retrieveStoreBySubdomain(subdomain: string) {
    const [stores] = await this.listStores({
      subdomain,
      status: ["active", "maintenance"],
    }) as any;
    return stores[0] || null;
  }

  /**
   * Retrieve store by custom domain
   */
  async retrieveStoreByDomain(domain: string) {
    const [stores] = await this.listStores({
      custom_domain: domain,
      status: ["active", "maintenance"],
    }) as any;
    return stores[0] || null;
  }

  /**
   * Retrieve store by handle
   */
  async retrieveStoreByHandle(handle: string) {
    const [stores] = await this.listStores({
      handle,
    }) as any;
    return stores[0] || null;
  }

  /**
   * Retrieve store by sales channel
   */
  async retrieveStoreBySalesChannel(sales_channel_id: string) {
    const [stores] = await this.listStores({
      sales_channel_id,
    }) as any;
    return stores[0] || null;
  }

  /**
   * Activate store
   */
  async activateStore(store_id: string) {
    return await this.updateStores({
      id: store_id,
      status: "active",
    } as any);
  }

  /**
   * Set store to maintenance mode
   */
  async setMaintenanceMode(store_id: string, enabled: boolean) {
    return await this.updateStores({
      id: store_id,
      status: enabled ? "maintenance" : "active",
    } as any);
  }

  async suspendStore(storeId: string, reason: string): Promise<any> {
    if (!reason || !reason.trim()) {
      throw new Error("Suspension reason is required");
    }
    const store = await this.retrieveStore(storeId) as any;
    if (store.status === "suspended") {
      throw new Error("Store is already suspended");
    }
    return await this.updateStores({
      id: storeId,
      status: "suspended",
      suspension_reason: reason,
      suspended_at: new Date(),
    } as any);
  }

  async getStoreMetrics(storeId: string): Promise<{
    storeId: string;
    status: string;
    productCount: number;
    orderCount: number;
    revenue: number;
    averageRating: number;
  }> {
    const store = await this.retrieveStore(storeId) as any;
    return {
      storeId,
      status: store.status || "unknown",
      productCount: Number(store.product_count || 0),
      orderCount: Number(store.order_count || 0),
      revenue: Number(store.total_revenue || 0),
      averageRating: Number(store.average_rating || 0),
    };
  }

  async updateStoreHours(
    storeId: string,
    hours: Record<string, any>,
  ): Promise<any> {
    if (!hours || Object.keys(hours).length === 0) {
      throw new Error("Operating hours data is required");
    }
    const validDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    for (const day of Object.keys(hours)) {
      if (!validDays.includes(day.toLowerCase())) {
        throw new Error(
          `Invalid day: ${day}. Must be one of: ${validDays.join(", ")}`,
        );
      }
    }
    await this.retrieveStore(storeId) as any;
    return await this.updateStores({
      id: storeId,
      operating_hours: hours,
    } as any);
  }
}

export default StoreModuleService;
