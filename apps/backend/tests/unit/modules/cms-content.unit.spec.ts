import { vi } from "vitest";
vi.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
      unique: () => chain,
      searchable: () => chain,
      index: () => chain,
    };
    return chain;
  };

  return {
    MedusaService: () =>
      class MockMedusaBase {
        async listCmsPages(_filter: any, _config?: any): Promise<any> {
          return [];
        }
        async retrieveCmsPage(_id: string): Promise<any> {
          return null;
        }
        async createCmsPages(_data: any): Promise<any> {
          return {};
        }
        async updateCmsPages(_data: any): Promise<any> {
          return {};
        }
        async listCmsNavigations(_filter: any): Promise<any> {
          return [];
        }
        async createCmsNavigations(_data: any): Promise<any> {
          return {};
        }
        async updateCmsNavigations(_data: any): Promise<any> {
          return {};
        }
      },
    model: {
      define: () => ({ indexes: () => ({}) }),
      id: chainable,
      text: chainable,
      number: chainable,
      json: chainable,
      enum: () => chainable(),
      boolean: chainable,
      dateTime: chainable,
      bigNumber: chainable,
      float: chainable,
      array: chainable,
      hasOne: () => chainable(),
      hasMany: () => chainable(),
      belongsTo: () => chainable(),
      manyToMany: () => chainable(),
    },
  };
});

import CMSContentModuleService from "../../../src/modules/cms-content/service";

describe("CMSContentModuleService", () => {
  let service: CMSContentModuleService;

  beforeEach(() => {
    service = new CMSContentModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("resolve", () => {
    it("resolves a page by slug and tenant", async () => {
      jest
        .spyOn(service, "listCmsPages")
        .mockResolvedValue([
          { id: "p1", slug: "about", tenant_id: "t1", status: "published" },
        ]);

      const result = await service.resolve({ slug: "about", tenantId: "t1" });

      expect(result).toEqual(
        expect.objectContaining({ id: "p1", slug: "about" }),
      );
    });

    it("returns null when page not found", async () => {
      vi.spyOn(service, "listCmsPages").mockResolvedValue([]);

      const result = await service.resolve({
        slug: "nonexistent",
        tenantId: "t1",
      });

      expect(result).toBeNull();
    });

    it("prefers region-specific page when country code matches", async () => {
      vi.spyOn(service, "listCmsPages").mockResolvedValue([
        { id: "p1", slug: "about", country_code: "GB", region_zone: null },
        { id: "p2", slug: "about", country_code: "US", region_zone: null },
      ]);

      const result = await service.resolve({
        slug: "about",
        tenantId: "t1",
        countryCode: "US",
      });

      expect(result.id).toBe("p2");
    });

    it("falls back to generic page when no region match", async () => {
      vi.spyOn(service, "listCmsPages").mockResolvedValue([
        { id: "p1", slug: "about", country_code: null, region_zone: null },
        { id: "p2", slug: "about", country_code: "GB", region_zone: null },
      ]);

      const result = await service.resolve({
        slug: "about",
        tenantId: "t1",
        countryCode: "FR",
      });

      expect(result.id).toBe("p1");
    });
  });

  describe("publish", () => {
    it("publishes a draft page", async () => {
      jest
        .spyOn(service, "retrieveCmsPage")
        .mockResolvedValue({ id: "p1", status: "draft" });
      const updateSpy = jest
        .spyOn(service, "updateCmsPages")
        .mockResolvedValue({});

      await service.publish("p1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "p1",
          status: "published",
        }),
      );
    });

    it("throws when page is already published", async () => {
      jest
        .spyOn(service, "retrieveCmsPage")
        .mockResolvedValue({ id: "p1", status: "published" });

      await expect(service.publish("p1")).rejects.toThrow(
        "Page is already published",
      );
    });
  });

  describe("archive", () => {
    it("archives a published page", async () => {
      jest
        .spyOn(service, "retrieveCmsPage")
        .mockResolvedValue({ id: "p1", status: "published" });
      const updateSpy = jest
        .spyOn(service, "updateCmsPages")
        .mockResolvedValue({});

      await service.archive("p1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "p1",
          status: "archived",
        }),
      );
    });

    it("throws when page is already archived", async () => {
      jest
        .spyOn(service, "retrieveCmsPage")
        .mockResolvedValue({ id: "p1", status: "archived" });

      await expect(service.archive("p1")).rejects.toThrow(
        "Page is already archived",
      );
    });
  });

  describe("getNavigation", () => {
    it("returns navigation for location", async () => {
      jest
        .spyOn(service, "listCmsNavigations")
        .mockResolvedValue([{ id: "nav-1", location: "header", locale: "en" }]);

      const result = await service.getNavigation({
        tenantId: "t1",
        location: "header",
      });

      expect(result).toEqual(expect.objectContaining({ id: "nav-1" }));
    });

    it("returns null when no navigation found", async () => {
      vi.spyOn(service, "listCmsNavigations").mockResolvedValue([]);

      const result = await service.getNavigation({
        tenantId: "t1",
        location: "footer",
      });

      expect(result).toBeNull();
    });

    it("prefers localized navigation", async () => {
      vi.spyOn(service, "listCmsNavigations").mockResolvedValue([
        { id: "nav-1", location: "header", locale: "en" },
        { id: "nav-2", location: "header", locale: "fr" },
      ]);

      const result = await service.getNavigation({
        tenantId: "t1",
        location: "header",
        locale: "fr",
      });

      expect(result.id).toBe("nav-2");
    });
  });

  describe("duplicatePage", () => {
    it("creates a copy of an existing page", async () => {
      vi.spyOn(service, "retrieveCmsPage").mockResolvedValue({
        id: "p1",
        tenant_id: "t1",
        title: "About Us",
        slug: "about",
        locale: "en",
        template: "default",
        layout: "full",
        seo_title: "About",
        seo_description: "About page",
        seo_image: null,
        country_code: null,
        region_zone: null,
        node_id: null,
        metadata: null,
      });
      const createSpy = jest
        .spyOn(service, "createCmsPages")
        .mockResolvedValue({ id: "p2" });

      const result = await service.duplicatePage("p1", "about-copy");

      expect(result).toEqual({ id: "p2" });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "About Us (Copy)",
          slug: "about-copy",
          status: "draft",
        }),
      );
    });
  });
});
