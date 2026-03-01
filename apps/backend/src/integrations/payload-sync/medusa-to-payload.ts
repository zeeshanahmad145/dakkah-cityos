import { MedusaContainer } from "@medusajs/framework/types";
import axios from "axios";
import { createLogger } from "../../lib/logger";
const logger = createLogger("integration:payload-sync");

export interface PayloadSyncConfig {
  payloadUrl: string;
  payloadApiKey: string;
}

export class MedusaToPayloadSync {
  private container: MedusaContainer;
  private config: PayloadSyncConfig;
  private client: ReturnType<typeof axios.create>;

  constructor(container: MedusaContainer, config: PayloadSyncConfig) {
    this.container = container;
    this.config = config;
    this.client = axios.create({
      baseURL: config.payloadUrl,
      headers: {
        Authorization: `Bearer ${config.payloadApiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Sync product to Payload ProductContent collection
   */
  async syncProduct(productId: string): Promise<void> {
    const query = this.container.resolve("query") as unknown as any;

    // Get product details from Medusa
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "handle",
        "title",
        "subtitle",
        "description",
        "thumbnail",
        "images.*",
        "status",
        "metadata",
        "created_at",
        "updated_at",
      ],
      filters: { id: productId },
    });

    if (!products || products.length === 0) {
      throw new Error(`Product ${productId} not found`);
    }

    const product = products[0];

    // Check if product content exists in Payload
    const existingContent = await this.findProductContent(product.id);

    const contentData = {
      medusaProductId: product.id,
      handle: product.handle,
      title: product.title,
      subtitle: product.subtitle || "",
      description: product.description || "",
      thumbnail: product.thumbnail || null,
      images: product.images?.map((img: any) => img.url) || [],
      status: product.status === "published" ? "published" : "draft",
      metadata: product.metadata || {},
      lastSyncedAt: new Date().toISOString(),
    };

    if (existingContent) {
      // Update existing
      await this.client.patch(
        `/api/product-content/${existingContent.id}`,
        contentData,
      );
    } else {
      // Create new
      await this.client.post("/api/product-content", contentData);
    }
  }

  /**
   * Sync tenant to Payload
   */
  async syncTenant(tenantId: string): Promise<void> {
    const tenantModuleService = this.container.resolve("tenantModuleService") as unknown as any;

    const tenant = await tenantModuleService.retrieveTenant(tenantId, {
      relations: ["stores"],
    });

    // Check if tenant exists in Payload
    const existingTenant = await this.findTenant(tenant.id);

    const tenantData = {
      medusaTenantId: tenant.id,
      name: tenant.name,
      handle: tenant.handle,
      domain: tenant.custom_domain || null,
      subdomain: tenant.subdomain || null,
      status: tenant.status,
      tier: tenant.subscription_tier,
      metadata: tenant.metadata || {},
      effectivePolicies: null,
      lastSyncedAt: new Date().toISOString(),
    };

    try {
      const governanceModule = this.container.resolve("governance") as unknown as any;
      tenantData.effectivePolicies =
        await governanceModule.resolveEffectivePolicies(tenantId);
    } catch {
      tenantData.effectivePolicies = {};
    }

    if (existingTenant) {
      await this.client.patch(`/api/tenants/${existingTenant.id}`, tenantData);
    } else {
      await this.client.post("/api/tenants", tenantData);
    }

    // Sync associated stores
    if (tenant.stores) {
      for (const store of tenant.stores) {
        await this.syncStore(store.id);
      }
    }
  }

  /**
   * Sync store to Payload
   */
  async syncStore(storeId: string): Promise<void> {
    const storeModuleService = this.container.resolve("storeModuleService") as unknown as any;

    const store = await storeModuleService.retrieveStore(storeId);

    const existingStore = await this.findStore(store.id);

    const storeData = {
      medusaStoreId: store.id,
      name: store.name,
      handle: store.handle,
      tenant: store.tenant_id,
      storeType: store.store_type,
      status: store.status,
      themeConfig: store.theme_config || {},
      metadata: store.metadata || {},
      lastSyncedAt: new Date().toISOString(),
    };

    if (existingStore) {
      await this.client.patch(`/api/stores/${existingStore.id}`, storeData);
    } else {
      await this.client.post("/api/stores", storeData);
    }
  }

  /**
   * Sync order data to Payload for analytics
   */
  async syncOrder(orderId: string): Promise<void> {
    const query = this.container.resolve("query") as unknown as any;

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "status",
        "total",
        "currency_code",
        "items.*",
        "customer.*",
        "created_at",
        "updated_at",
      ],
      filters: { id: orderId },
    });

    if (!orders || orders.length === 0) {
      throw new Error(`Order ${orderId} not found`);
    }

    const order = orders[0];

    // Send to Payload analytics collection
    await this.client.post("/api/order-analytics", {
      medusaOrderId: order.id,
      displayId: order.display_id,
      status: order.status,
      total: order.total,
      currencyCode: order.currency_code,
      itemCount: order.items?.length || 0,
      customerId: order.customer?.id || null,
      createdAt: order.created_at,
    });
  }

  /**
   * Find product content in Payload by Medusa product ID
   */
  private async findProductContent(
    medusaProductId: string,
  ): Promise<any | null> {
    try {
      const response = await this.client.get("/api/product-content", {
        params: {
          where: {
            medusaProductId: { equals: medusaProductId },
          },
          limit: 1,
        },
      });

      return response.data.docs?.[0] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find tenant in Payload
   */
  private async findTenant(medusaTenantId: string): Promise<any | null> {
    try {
      const response = await this.client.get("/api/tenants", {
        params: {
          where: {
            medusaTenantId: { equals: medusaTenantId },
          },
          limit: 1,
        },
      });

      return response.data.docs?.[0] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find store in Payload
   */
  private async findStore(medusaStoreId: string): Promise<any | null> {
    try {
      const response = await this.client.get("/api/stores", {
        params: {
          where: {
            medusaStoreId: { equals: medusaStoreId },
          },
          limit: 1,
        },
      });

      return response.data.docs?.[0] || null;
    } catch (error) {
      return null;
    }
  }

  async syncGovernancePolicies(tenantId: string): Promise<void> {
    const governanceModule = this.container.resolve("governance") as unknown as any;
    const effectivePolicies =
      await governanceModule.resolveEffectivePolicies(tenantId);
    const authorities = await governanceModule.listGovernanceAuthorities({
      tenant_id: tenantId,
    });
    const authorityList = Array.isArray(authorities)
      ? authorities
      : [authorities].filter(Boolean);

    const policyData = {
      tenantId,
      effectivePolicies,
      authorities: authorityList.map((a: any) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        type: a.type,
        jurisdictionLevel: a.jurisdiction_level,
        residencyZone: a.residency_zone,
        policies: a.policies,
        status: a.status,
      })),
      lastSyncedAt: new Date().toISOString(),
    };

    try {
      const existing = await this.client.get("/api/governance-policies", {
        params: {
          where: { tenantId: { equals: tenantId } },
          limit: 1,
        },
      });

      if (existing.data.docs?.[0]) {
        await this.client.patch(
          `/api/governance-policies/${existing.data.docs[0].id}`,
          policyData,
        );
      } else {
        await this.client.post("/api/governance-policies", policyData);
      }
    } catch (err: any) {
      logger.info(
        `[PayloadSync] Failed to sync governance policies for tenant ${tenantId}: ${err.message}`,
      );
      throw err;
    }
  }

  /**
   * Bulk sync all products
   */
  async syncAllProducts(): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const query = this.container.resolve("query") as unknown as any;

    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id"],
      pagination: { take: 1000 },
    });

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const product of products) {
      try {
        await this.syncProduct(product.id);
        success++;
      } catch (error) {
        failed++;
        errors.push(`${product.id}: ${(error instanceof Error ? error.message : String(error))}`);
      }
    }

    return { success, failed, errors };
  }
}
