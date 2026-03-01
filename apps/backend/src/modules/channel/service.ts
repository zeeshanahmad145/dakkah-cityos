import { MedusaService } from "@medusajs/framework/utils";
import SalesChannelMapping from "./models/sales-channel-mapping";

class ChannelModuleService extends MedusaService({
  SalesChannelMapping,
}) {
  async getChannelForRequest(
    tenantId: string,
    channelType: string,
    nodeId?: string,
  ) {
    const query: Record<string, any> = {
      tenant_id: tenantId,
      channel_type: channelType,
      is_active: true,
    };

    if (nodeId) {
      query.node_id = nodeId;
    }

    const mappings = await this.listSalesChannelMappings(query) as any;
    const list = Array.isArray(mappings)
      ? mappings
      : [mappings].filter(Boolean);

    if (list.length > 0) {
      return list[0];
    }

    if (nodeId) {
      const fallback = await this.listSalesChannelMappings({
        tenant_id: tenantId,
        channel_type: channelType,
        is_active: true,
      }) as any;
      const fallbackList = Array.isArray(fallback)
        ? fallback
        : [fallback].filter(Boolean);
      return (
        fallbackList.find((m: any) => !m.node_id) || fallbackList[0] || null
      );
    }

    return null;
  }

  async listChannels(tenantId: string) {
    const mappings = await this.listSalesChannelMappings({
      tenant_id: tenantId,
    }) as any;
    return Array.isArray(mappings) ? mappings : [mappings].filter(Boolean);
  }

  async createMapping(data: {
    tenant_id: string;
    channel_type: string;
    name: string;
    description?: string;
    medusa_sales_channel_id?: string;
    node_id?: string;
    config?: Record<string, any>;
    is_active?: boolean;
    metadata?: Record<string, any>;
  }) {
    return await this.createSalesChannelMappings({
      tenant_id: data.tenant_id,
      channel_type: data.channel_type,
      name: data.name,
      description: data.description || null,
      medusa_sales_channel_id: data.medusa_sales_channel_id || null,
      node_id: data.node_id || null,
      config: data.config || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
      metadata: data.metadata || null,
    } as any);
  }

  async getActiveChannels(tenantId: string) {
    const mappings = await this.listSalesChannelMappings({
      tenant_id: tenantId,
      is_active: true,
    }) as any;

    const list = Array.isArray(mappings)
      ? mappings
      : [mappings].filter(Boolean);

    const channelsByType = new Map<string, any[]>();
    list.forEach((channel: any) => {
      const type = channel.channel_type;
      if (!channelsByType.has(type)) {
        channelsByType.set(type, []);
      }
      channelsByType.get(type)!.push({
        id: channel.id,
        name: channel.name,
        medusaChannelId: channel.medusa_sales_channel_id,
        nodeId: channel.node_id,
        description: channel.description,
      });
    });

    return {
      tenantId,
      totalChannels: list.length,
      channelsByType: Object.fromEntries(channelsByType),
      channels: list,
    };
  }

  async getChannelByCode(code: string) {
    try {
      const mappings = await this.listSalesChannelMappings({}) as any;
      const list = Array.isArray(mappings)
        ? mappings
        : [mappings].filter(Boolean);

      const matching = list.find((channel: any) => {
        if (!channel.name) return false;
        return (
          channel.name.toLowerCase().replace(/\s+/g, "-") === code.toLowerCase()
        );
      });

      if (!matching) {
        return null;
      }

      return {
        id: matching.id,
        code: matching.name.toLowerCase().replace(/\s+/g, "-"),
        name: matching.name,
        type: matching.channel_type,
        isActive: matching.is_active,
        medusaChannelId: matching.medusa_sales_channel_id,
        config: matching.config || {},
      };
    } catch (error) {
      return null;
    }
  }

  async validateChannelAccess(
    tenantId: string,
    channelId: string,
  ): Promise<boolean> {
    try {
      const channel = await this.retrieveSalesChannelMapping(channelId) as any;

      if (!channel) {
        return false;
      }

      if (channel.tenant_id !== tenantId) {
        return false;
      }

      if (!channel.is_active) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async getChannelCapabilities(channelId: string) {
    try {
      const channel = await this.retrieveSalesChannelMapping(channelId) as any;

      if (!channel) {
        return null;
      }

      const capabilities: Record<string, boolean> = {
        supportsInventory: ["web", "mobile", "api", "kiosk"].includes(
          channel.channel_type,
        ),
        supportsPricing: true,
        supportsPromotions: true,
        supportsSubscriptions: ["web", "mobile"].includes(channel.channel_type),
        supportsReturns: ["web", "mobile"].includes(channel.channel_type),
        supportsGiftCards: true,
        supportsB2B:
          channel.channel_type === "api" || channel.channel_type === "internal",
        supportsMobileWallet: channel.channel_type === "mobile",
        supportsQRCode: ["web", "mobile", "kiosk"].includes(
          channel.channel_type,
        ),
      };

      const baseCapabilities = this.getBaseCapabilitiesByType(
        channel.channel_type,
      );

      return {
        channelId,
        channelType: channel.channel_type,
        capabilities: {
          ...baseCapabilities,
          ...capabilities,
        },
        maxConcurrentUsers: channel.channel_type === "api" ? 1000 : 100,
        apiRateLimit:
          channel.channel_type === "api" ? "unlimited" : "1000/hour",
        supportedPaymentMethods: this.getPaymentMethodsByType(
          channel.channel_type,
        ),
      };
    } catch (error) {
      return null;
    }
  }

  async syncChannelSettings(channelId: string, settings: Record<string, any>) {
    try {
      const channel = await this.retrieveSalesChannelMapping(channelId) as any;

      if (!channel) {
        return null;
      }

      const updatedConfig = {
        ...(channel.config || {}),
        ...settings,
        lastSyncTime: new Date().toISOString(),
      };

      const updated = await this.updateSalesChannelMappings({
        id: channelId,
        config: updatedConfig,
      } as any);

      return {
        channelId,
        synced: true,
        previousConfig: channel.config || {},
        newConfig: updatedConfig,
        syncedSettings: Object.keys(settings),
        syncTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      return null;
    }
  }

  async getChannelAnalytics(channelId: string) {
    try {
      const channel = await this.retrieveSalesChannelMapping(channelId) as any;

      if (!channel) {
        return null;
      }

      const allMappings = await this.listSalesChannelMappings({
        tenant_id: channel.tenant_id,
      }) as any;
      const mappingList = Array.isArray(allMappings)
        ? allMappings
        : [allMappings].filter(Boolean);
      const totalChannels = mappingList.length;

      return {
        channelId,
        channelName: channel.name,
        channelType: channel.channel_type,
        isActive: channel.is_active,
        totalPeerChannels: totalChannels,
        createdAt: channel.created_at,
        config: channel.config || {},
        metadata: channel.metadata || {},
      };
    } catch (error) {
      return null;
    }
  }

  async syncChannelInventory(channelId: string, productIds: string[]) {
    try {
      const channel = await this.retrieveSalesChannelMapping(channelId) as any;

      if (!channel) {
        throw new Error("Channel not found");
      }

      if (!channel.is_active) {
        throw new Error("Channel is not active");
      }

      const existingConfig = (channel.config || {}) as Record<string, any>;
      const syncedProducts = (existingConfig.synced_products || []) as string[];

      const newProducts = productIds.filter(
        (id: string) => !syncedProducts.includes(id),
      );
      const updatedSyncedProducts = [...syncedProducts, ...newProducts];

      const updatedConfig = {
        ...existingConfig,
        synced_products: updatedSyncedProducts,
        last_inventory_sync: new Date().toISOString(),
        sync_count: ((existingConfig.sync_count as number) || 0) + 1,
      };

      await this.updateSalesChannelMappings({
        id: channelId,
        config: updatedConfig,
      } as any);

      return {
        channelId,
        channelName: channel.name,
        syncedCount: newProducts.length,
        totalSynced: updatedSyncedProducts.length,
        newProductIds: newProducts,
        syncTimestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      throw new Error(`Failed to sync inventory: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  async validateChannelConfig(channelId: string) {
    try {
      const channel = await this.retrieveSalesChannelMapping(channelId) as any;

      if (!channel) {
        return { valid: false, errors: ["Channel not found"] };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      if (!channel.name || channel.name.trim() === "") {
        errors.push("Channel name is required");
      }

      if (!channel.channel_type) {
        errors.push("Channel type is required");
      }

      if (!channel.tenant_id) {
        errors.push("Tenant ID is required");
      }

      if (!channel.medusa_sales_channel_id) {
        warnings.push("No Medusa sales channel linked");
      }

      const config = channel.config || {};
      if (!config || Object.keys(config).length === 0) {
        warnings.push("Channel has no configuration settings");
      }

      return {
        channelId,
        channelName: channel.name,
        valid: errors.length === 0,
        errors,
        warnings,
        configKeys: Object.keys(config),
      };
    } catch (error) {
      return {
        valid: false,
        errors: ["Failed to validate channel configuration"],
      };
    }
  }

  private getBaseCapabilitiesByType(
    channelType: string,
  ): Record<string, boolean> {
    const baseMap: Record<string, Record<string, boolean>> = {
      web: {
        supportsSearch: true,
        supportsFiltering: true,
        supportsSorting: true,
        supportsReviews: true,
      },
      mobile: {
        supportsPushNotifications: true,
        supportsGeolocation: true,
        supportsOfflineMode: true,
        supportsAR: true,
      },
      api: {
        supportsWebhooks: true,
        supportsRateLimiting: true,
        supportsApiKeys: true,
        supportsOAuth: true,
      },
      kiosk: {
        supportsTouchInterface: true,
        supportsQueueing: true,
        supportsPrinting: true,
        supportsOfflineMode: true,
      },
      internal: {
        supportsAdminPanel: true,
        supportsAuditLogs: true,
        supportsRoleBasedAccess: true,
        supportsDataExport: true,
      },
    };

    return baseMap[channelType] || {};
  }

  private getPaymentMethodsByType(channelType: string): string[] {
    const paymentMap: Record<string, string[]> = {
      web: [
        "credit_card",
        "debit_card",
        "paypal",
        "apple_pay",
        "google_pay",
        "bank_transfer",
      ],
      mobile: [
        "credit_card",
        "debit_card",
        "apple_pay",
        "google_pay",
        "wallet",
      ],
      api: ["credit_card", "debit_card", "bank_transfer", "cryptocurrency"],
      kiosk: ["credit_card", "debit_card", "cash"],
      internal: ["credit_card", "bank_transfer"],
    };

    return paymentMap[channelType] || ["credit_card", "debit_card"];
  }
}

export default ChannelModuleService;
