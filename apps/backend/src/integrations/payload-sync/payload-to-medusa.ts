import { MedusaContainer } from "@medusajs/framework/types";
import axios from "axios";
import { createLogger } from "../../lib/logger";
const logger = createLogger("integration:payload-sync");

export interface PayloadToMedusaSyncConfig {
  payloadUrl: string;
  payloadApiKey: string;
}

export class PayloadToMedusaSync {
  private container: MedusaContainer;
  private config: PayloadToMedusaSyncConfig;
  private client: ReturnType<typeof axios.create>;

  constructor(container: MedusaContainer, config: PayloadToMedusaSyncConfig) {
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
   * Sync enhanced product content from Payload to Medusa
   */
  async syncProductContent(payloadContentId: string): Promise<void> {
    // Get content from Payload
    const response = await this.client.get(
      `/api/product-content/${payloadContentId}`,
    );
    const content = response.data;

    const query = this.container.resolve("query") as unknown as any;

    // Find Medusa product
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "metadata"],
      filters: { id: content.medusaProductId },
    });

    if (!products || products.length === 0) {
      throw new Error(`Product ${content.medusaProductId} not found in Medusa`);
    }

    // Update product metadata with enhanced content
    const productModuleService = this.container.resolve("productModuleService") as unknown as any;

    await productModuleService.updateProducts({
      id: content.medusaProductId,
      metadata: {
        ...products[0].metadata,
        payload_content_id: content.id,
        enhanced_description: content.enhancedDescription || null,
        seo_title: content.seoTitle || null,
        seo_description: content.seoDescription || null,
        features: content.features || [],
        specifications: content.specifications || {},
        last_payload_sync: new Date().toISOString(),
      },
    });
  }

  /**
   * Sync page data from Payload to Medusa metadata
   */
  async syncPage(payloadPageId: string): Promise<void> {
    const response = await this.client.get(`/api/pages/${payloadPageId}`);
    const page = response.data;

    // Store in custom page module or as store metadata
    const storeModuleService = this.container.resolve("storeModuleService") as unknown as any;

    // Find store associated with page tenant
    const stores = await storeModuleService.listStores({
      tenant_id: page.tenant,
    });

    if (stores.length > 0) {
      const store = stores[0];

      // Update store metadata with page info
      await storeModuleService.updateStores({
        id: store.id,
        metadata: {
          ...store.metadata,
          pages: {
            ...(store.metadata?.pages || {}),
            [page.slug]: {
              id: page.id,
              title: page.title,
              content: page.content,
              lastSyncedAt: new Date().toISOString(),
            },
          },
        },
      });
    }
  }

  /**
   * Process integration endpoint configuration
   */
  async processIntegrationEndpoint(endpointId: string): Promise<void> {
    const response = await this.client.get(
      `/api/integration-endpoints/${endpointId}`,
    );
    const endpoint = response.data;

    // Store endpoint config in Medusa
    // This could be used for dynamic API routing or configuration
    logger.info(`Processing integration endpoint: ${JSON.stringify(endpoint)}`);

    // Example: Store in a configuration service
    // const configService = this.container.resolve("configService") as unknown as any;
    // await configService.set(`integration.${endpoint.system}`, endpoint.config);
  }

  /**
   * Sync media from Payload to Medusa
   */
  async syncMedia(payloadMediaId: string): Promise<string | null> {
    const response = await this.client.get(`/api/media/${payloadMediaId}`);
    const media = response.data;

    if (!media.url) {
      return null;
    }

    // Download media from Payload
    const fileResponse = await axios.get(
      `${this.config.payloadUrl}${media.url}`,
      {
        responseType: "arraybuffer",
      },
    );

    // Upload to Medusa file service
    const fileModuleService = this.container.resolve("fileModuleService") as unknown as any;

    const file = await fileModuleService.createFiles({
      filename: media.filename,
      mimeType: media.mimeType,
      content: Buffer.from(fileResponse.data),
    });

    return file.url;
  }

  /**
   * Process webhook log for retry
   */
  async processWebhookLog(logId: string): Promise<void> {
    const response = await this.client.get(`/api/webhook-logs/${logId}`);
    const log = response.data;

    if (log.status === "failed" && log.retryCount < 3) {
      // Retry the webhook
      try {
        await axios.post(log.endpoint, log.payload, {
          headers: log.headers || {},
        });

        // Update log as successful
        await this.client.patch(`/api/webhook-logs/${logId}`, {
          status: "success",
          processedAt: new Date().toISOString(),
        });
      } catch (error: unknown) {
        await this.client.patch(`/api/webhook-logs/${logId}`, {
          retryCount: log.retryCount + 1,
          lastError: (error instanceof Error ? error.message : String(error)),
        });
      }
    }
  }

  /**
   * Sync all pending product content updates
   */
  async syncPendingProductContent(): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    // Get all product content marked for sync
    const response = await this.client.get("/api/product-content", {
      params: {
        where: {
          needsSync: { equals: true },
        },
        limit: 100,
      },
    });

    const contents = response.data.docs || [];
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const content of contents) {
      try {
        await this.syncProductContent(content.id);

        // Mark as synced
        await this.client.patch(`/api/product-content/${content.id}`, {
          needsSync: false,
          lastSyncedAt: new Date().toISOString(),
        });

        success++;
      } catch (error: unknown) {
        failed++;
        errors.push(`${content.id}: ${(error instanceof Error ? error.message : String(error))}`);
      }
    }

    return { success, failed, errors };
  }
}
