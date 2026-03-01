import { MedusaService } from "@medusajs/framework/utils";
import WhiteLabelConfig from "./models/white-label-config";
import WhiteLabelTheme from "./models/white-label-theme";

class WhiteLabelModuleService extends MedusaService({
  WhiteLabelConfig,
  WhiteLabelTheme,
}) {
  /**
   * Get the white-label configuration for a tenant.
   */
  async getConfigForTenant(
    tenantId: string,
  ): Promise<Record<string, unknown> | null> {
    const configs = (await this.listWhiteLabelConfigs({
      tenant_id: tenantId,
    })) as unknown as Record<string, unknown>[];
    const list = Array.isArray(configs) ? configs : [];
    return list[0] ?? null;
  }

  /**
   * Create or update the white-label config for a tenant.
   */
  async upsertConfig(
    tenantId: string,
    data: {
      brandName?: string;
      logoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      customDomain?: string;
      status?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<any> {
    const existing = await this.getConfigForTenant(tenantId);

    if (existing) {
      return await this.updateWhiteLabelConfigs({
        id: (existing as Record<string, unknown>).id,
        brand_name:
          data.brandName ?? (existing as Record<string, unknown>).brand_name,
        logo_url:
          data.logoUrl ?? (existing as Record<string, unknown>).logo_url,
        primary_color:
          data.primaryColor ??
          (existing as Record<string, unknown>).primary_color,
        secondary_color:
          data.secondaryColor ??
          (existing as Record<string, unknown>).secondary_color,
        custom_domain:
          data.customDomain ??
          (existing as Record<string, unknown>).custom_domain,
        status: data.status ?? (existing as Record<string, unknown>).status,
        metadata:
          data.metadata ?? (existing as Record<string, unknown>).metadata,
      } as unknown as any);
    }

    return await this.createWhiteLabelConfigs({
      tenant_id: tenantId,
      brand_name: data.brandName ?? "",
      logo_url: data.logoUrl ?? null,
      primary_color: data.primaryColor ?? null,
      secondary_color: data.secondaryColor ?? null,
      custom_domain: data.customDomain ?? null,
      status: data.status ?? "pending",
      metadata: data.metadata ?? null,
    } as unknown as any);
  }

  /**
   * Publish the active theme for a config, making it live.
   */
  async publishTheme(themeId: string): Promise<unknown> {
    const theme = (await this.retrieveWhiteLabelTheme(
      themeId,
    )) as unknown as Record<string, unknown>;
    const existing = (await this.listWhiteLabelThemes({
      white_label_id: theme.white_label_id,
    })) as unknown as Record<string, unknown>[];
    for (const t of existing) {
      if (t.id !== themeId && t.is_published) {
        await this.updateWhiteLabelThemes({
          id: t.id as string,
          is_published: false,
        } as unknown as any);
      }
    }
    return this.updateWhiteLabelThemes({
      id: themeId,
      is_published: true,
    } as unknown as any);
  }
}

export default WhiteLabelModuleService;
