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
        async listReviews(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async retrieveReview(_id: string): Promise<any> {
          return null;
        }
        async createReviews(_data: any): Promise<any> {
          return {};
        }
        async updateReviews(_filter: any, _data?: any): Promise<any> {
          return {};
        }
        async deleteReviews(_id: string): Promise<any> {
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
    Module: (_config: any) => ({}),
  };
});

import ReviewModuleService from "../../../src/modules/review/service";

describe("ReviewModuleService – Enhanced", () => {
  let service: ReviewModuleService;

  beforeEach(() => {
    service = new ReviewModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("getReviewAnalytics", () => {
    it("returns analytics with rating distribution and response rate", async () => {
      vi.spyOn(service, "listReviews").mockResolvedValue([
        {
          rating: 5,
          is_verified_purchase: true,
          metadata: { vendor_response: "Thanks!" },
        },
        { rating: 4, is_verified_purchase: true },
        { rating: 3, is_verified_purchase: false },
      ]);

      const result = await service.getReviewAnalytics("vendor-1");
      expect(result.totalReviews).toBe(3);
      expect(result.averageRating).toBe(4);
      expect(result.ratingDistribution[5]).toBe(1);
      expect(result.verifiedPurchaseRate).toBe(67);
    });

    it("returns zero metrics when no reviews exist", async () => {
      vi.spyOn(service, "listReviews").mockResolvedValue([]);

      const result = await service.getReviewAnalytics("vendor-1");
      expect(result.totalReviews).toBe(0);
      expect(result.averageRating).toBe(0);
    });

    it("calculates response rate correctly", async () => {
      vi.spyOn(service, "listReviews").mockResolvedValue([
        { rating: 5, metadata: { vendor_response: "Thank you" } },
        { rating: 4, metadata: { vendor_response: "Appreciated" } },
        { rating: 3, metadata: null },
        { rating: 2, metadata: null },
      ]);

      const result = await service.getReviewAnalytics("vendor-1");
      expect(result.responseRate).toBe(50);
    });
  });

  describe("flagInappropriateReview", () => {
    it("flags a review and returns flag count", async () => {
      vi.spyOn(service, "retrieveReview").mockResolvedValue({
        id: "r1",
        flags: [],
        metadata: {},
      });
      vi.spyOn(service, "updateReviews").mockResolvedValue({});

      const result = await service.flagInappropriateReview(
        "r1",
        "spam",
        "reporter-1",
      );
      expect(result.flagCount).toBe(1);
      expect(result.needsModeration).toBe(false);
    });

    it("triggers moderation after 3 flags", async () => {
      vi.spyOn(service, "retrieveReview").mockResolvedValue({
        id: "r1",
        metadata: {
          flags: [
            { reporterId: "r1", reason: "spam" },
            { reporterId: "r2", reason: "offensive" },
          ],
        },
      });
      vi.spyOn(service, "updateReviews").mockResolvedValue({});

      const result = await service.flagInappropriateReview(
        "r1",
        "harassment",
        "reporter-3",
      );
      expect(result.flagCount).toBe(3);
      expect(result.needsModeration).toBe(true);
      expect(result.status).toBe("pending_moderation");
    });

    it("throws when reporter already flagged the review", async () => {
      vi.spyOn(service, "retrieveReview").mockResolvedValue({
        id: "r1",
        metadata: {
          flags: [{ reporterId: "reporter-1", reason: "spam" }],
        },
      });

      await expect(
        service.flagInappropriateReview("r1", "spam", "reporter-1"),
      ).rejects.toThrow("You have already flagged this review");
    });

    it("throws when required parameters are missing", async () => {
      await expect(
        service.flagInappropriateReview("", "reason", "reporter"),
      ).rejects.toThrow("Review ID, reason, and reporter ID are required");
    });
  });

  describe("getReviewTrends", () => {
    it("returns monthly trends for the specified period", async () => {
      const now = new Date();
      vi.spyOn(service, "listReviews").mockResolvedValue([
        { rating: 5, created_at: now.toISOString() },
        { rating: 4, created_at: now.toISOString() },
        { rating: 2, created_at: now.toISOString() },
      ]);

      const result = await service.getReviewTrends("vendor-1", 3);
      expect(result.periodMonths).toBe(3);
      expect(result.trends).toHaveLength(3);
    });

    it("defaults to 6 months when not specified", async () => {
      vi.spyOn(service, "listReviews").mockResolvedValue([]);

      const result = await service.getReviewTrends("vendor-1");
      expect(result.periodMonths).toBe(6);
      expect(result.trends).toHaveLength(6);
    });
  });
});
