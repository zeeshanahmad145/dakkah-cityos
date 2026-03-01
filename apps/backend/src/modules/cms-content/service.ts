import { MedusaService } from "@medusajs/framework/utils";
import CmsPage from "./models/cms-page";
import CmsNavigation from "./models/cms-navigation";

type CmsPageRecord = {
  id: string;
  tenant_id: string;
  slug: string;
  title: string;
  locale: string | null;
  status: string;
  template: string | null;
  layout: Record<string, unknown> | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  country_code: string | null;
  region_zone: string | null;
  node_id: string | null;
  metadata: Record<string, unknown> | null;
  published_at: Date | null;
};

type CmsNavigationRecord = {
  id: string;
  tenant_id: string;
  location: string;
  locale: string;
  status: string;
  items: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
};

interface CMSContentServiceBase {
  listCmsPages(
    filters?: Record<string, unknown>,
    opts?: Record<string, unknown>,
  ): Promise<CmsPageRecord[]>;
  retrieveCmsPage(id: string): Promise<CmsPageRecord>;
  createCmsPages(data: Record<string, unknown>): Promise<CmsPageRecord>;
  updateCmsPages(data: Record<string, unknown>): Promise<CmsPageRecord>;
  listCmsNavigations(
    filters?: Record<string, unknown>,
    opts?: Record<string, unknown>,
  ): Promise<CmsNavigationRecord[]>;
  createCmsNavigations(
    data: Record<string, unknown>,
  ): Promise<CmsNavigationRecord>;
  updateCmsNavigations(
    data: Record<string, unknown>,
  ): Promise<CmsNavigationRecord>;
}

const Base = MedusaService({ CmsPage, CmsNavigation });

class CMSContentModuleService extends Base implements CMSContentServiceBase {
  async resolve(data: {
    slug: string;
    tenantId: string;
    locale?: string;
    countryCode?: string;
    regionZone?: string;
  }): Promise<CmsPageRecord | null> {
    const filters: Record<string, unknown> = {
      slug: data.slug,
      tenant_id: data.tenantId,
      status: "published",
    };
    if (data.locale) filters.locale = data.locale;

    const pages = await this.listCmsPages(filters) as any;
    if (pages.length === 0) return null;

    if (data.countryCode || data.regionZone) {
      const specific = pages.find((p) => {
        if (
          data.countryCode &&
          p.country_code &&
          p.country_code !== data.countryCode
        )
          return false;
        if (
          data.regionZone &&
          p.region_zone &&
          p.region_zone !== data.regionZone
        )
          return false;
        return true;
      });
      if (specific) return specific;
    }

    return pages.find((p) => !p.country_code && !p.region_zone) ?? pages[0];
  }

  async publish(pageId: string): Promise<CmsPageRecord> {
    const page = await this.retrieveCmsPage(pageId) as any;
    if (page.status === "published")
      throw new Error("Page is already published");
    return this.updateCmsPages({
      id: pageId,
      status: "published",
      published_at: new Date(),
    } as any);
  }

  async archive(pageId: string): Promise<CmsPageRecord> {
    const page = await this.retrieveCmsPage(pageId) as any;
    if (page.status === "archived") throw new Error("Page is already archived");
    return this.updateCmsPages({ id: pageId, status: "archived" } as any);
  }

  async getNavigation(data: {
    tenantId: string;
    location: string;
    locale?: string;
  }): Promise<CmsNavigationRecord | null> {
    const filters: Record<string, unknown> = {
      tenant_id: data.tenantId,
      location: data.location,
      status: "active",
    };
    if (data.locale) filters.locale = data.locale;

    const navs = await this.listCmsNavigations(filters) as any;
    if (navs.length === 0) return null;
    if (data.locale) {
      const localized = navs.find((n) => n.locale === data.locale);
      if (localized) return localized;
    }
    return navs.find((n) => n.locale === "en") ?? navs[0];
  }

  async updateNavigation(data: {
    tenantId: string;
    location: string;
    locale?: string;
    items: Record<string, unknown>[];
    metadata?: Record<string, unknown>;
  }): Promise<CmsNavigationRecord> {
    const existing = await this.getNavigation({
      tenantId: data.tenantId,
      location: data.location,
      locale: data.locale,
    });

    if (existing) {
      return this.updateCmsNavigations({
        id: existing.id,
        items: data.items as unknown as Record<string, unknown>,
        metadata: data.metadata ?? existing.metadata,
      } as any);
    }

    return this.createCmsNavigations({
      tenant_id: data.tenantId,
      location: data.location,
      locale: data.locale ?? "en",
      items: data.items as unknown as Record<string, unknown>,
      status: "active",
      metadata: data.metadata ?? null,
    } as any);
  }

  async listPublishedPages(
    tenantId: string,
    options?: { locale?: string; limit?: number; offset?: number },
  ): Promise<CmsPageRecord[]> {
    const filters: Record<string, unknown> = {
      tenant_id: tenantId,
      status: "published",
    };
    if (options?.locale) filters.locale = options.locale;
    return this.listCmsPages(filters, {
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
      order: { published_at: "DESC" },
    });
  }

  async duplicatePage(
    pageId: string,
    newSlug?: string,
  ): Promise<CmsPageRecord> {
    const original = await this.retrieveCmsPage(pageId) as any;
    return this.createCmsPages({
      tenant_id: original.tenant_id,
      title: `${original.title} (Copy)`,
      slug: newSlug ?? `${original.slug}-copy-${Date.now()}`,
      locale: original.locale,
      status: "draft",
      template: original.template,
      layout: original.layout,
      seo_title: original.seo_title,
      seo_description: original.seo_description,
      seo_image: original.seo_image,
      country_code: original.country_code,
      region_zone: original.region_zone,
      node_id: original.node_id,
      metadata: original.metadata,
    });
  }
}

export default CMSContentModuleService;
