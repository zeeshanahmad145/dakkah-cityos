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
        async listLiveStreams(_filter: any): Promise<any> {
          return [];
        }
        async listLiveProducts(_filter: any): Promise<any> {
          return [];
        }
        async listSocialPosts(_filter: any): Promise<any> {
          return [];
        }
        async retrieveSocialPost(_id: string): Promise<any> {
          return null;
        }
        async createSocialPosts(_data: any): Promise<any> {
          return {};
        }
        async updateSocialPosts(_data: any): Promise<any> {
          return {};
        }
        async listSocialShares(_filter: any): Promise<any> {
          return [];
        }
        async createSocialShares(_data: any): Promise<any> {
          return {};
        }
        async listGroupBuys(_filter: any): Promise<any> {
          return [];
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

import SocialCommerceModuleService from "../../../src/modules/social-commerce/service";

describe("SocialCommerceModuleService", () => {
  let service: SocialCommerceModuleService;

  beforeEach(() => {
    service = new SocialCommerceModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("getPostAnalytics", () => {
    it("returns engagement analytics for a post", async () => {
      vi.spyOn(service, "retrieveSocialPost").mockResolvedValue({
        id: "post-1",
        engagement_count: 150,
        share_count: 30,
        view_count: 1000,
      });
      vi.spyOn(service, "listSocialShares").mockResolvedValue([
        { id: "s1", shared_at: new Date() },
        { id: "s2", shared_at: new Date() },
      ]);

      const result = await service.getPostAnalytics("post-1");

      expect(result.engagementCount).toBe(150);
      expect(result.shareCount).toBe(30);
      expect(result.engagementRate).toBe(15);
      expect(result.shares).toHaveLength(2);
    });
  });

  describe("schedulePost", () => {
    it("schedules a draft post for future publication", async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      jest
        .spyOn(service, "retrieveSocialPost")
        .mockResolvedValue({ id: "post-1", status: "draft" });
      const updateSpy = jest
        .spyOn(service, "updateSocialPosts")
        .mockResolvedValue({ id: "post-1", status: "scheduled" });

      await service.schedulePost("post-1", futureDate);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "scheduled",
          scheduled_at: futureDate,
        }),
      );
    });

    it("throws when date is in the past", async () => {
      await expect(
        service.schedulePost("post-1", new Date("2020-01-01")),
      ).rejects.toThrow("Scheduled publication date must be in the future");
    });

    it("throws when post is already published", async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      jest
        .spyOn(service, "retrieveSocialPost")
        .mockResolvedValue({ id: "post-1", status: "published" });

      await expect(service.schedulePost("post-1", futureDate)).rejects.toThrow(
        "Post is already published",
      );
    });
  });

  describe("createPost", () => {
    it("creates a social post with products", async () => {
      const createSpy = jest
        .spyOn(service, "createSocialPosts")
        .mockResolvedValue({
          id: "post-1",
          status: "published",
          vendor_id: "v1",
        });

      const result = await service.createPost(
        "v1",
        "Check out our new products!",
        ["prod-1", "prod-2"],
      );

      expect(result.id).toBe("post-1");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          vendor_id: "v1",
          content: "Check out our new products!",
          product_ids: ["prod-1", "prod-2"],
          status: "published",
        }),
      );
    });
  });

  describe("trackEngagement", () => {
    it("increments engagement count on like", async () => {
      jest
        .spyOn(service, "retrieveSocialPost")
        .mockResolvedValue({ id: "post-1", engagement_count: 5 });
      const updateSpy = jest
        .spyOn(service, "updateSocialPosts")
        .mockResolvedValue({});

      await service.trackEngagement("post-1", "like");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ engagement_count: 6 }),
      );
    });
  });
});
