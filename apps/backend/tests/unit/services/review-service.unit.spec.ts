jest.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
    };
    return chain;
  };
  return {
    MedusaService: () =>
      class MockMedusaBase {
        async listReviews(_filter: any, _opts?: any): Promise<any> {
          return [];
        }
        async retrieveReview(_id: string): Promise<any> {
          return null;
        }
        async createReviews(_data: any): Promise<any> {
          return {};
        }
        async updateReviews(_sel: any, _data?: any): Promise<any> {
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
  };
});

import ReviewModuleService from "../../../src/modules/review/service";

describe("ReviewModuleService", () => {
  let service: ReviewModuleService;

  beforeEach(() => {
    service = new ReviewModuleService();
    jest.clearAllMocks();
  });

  describe("createReview", () => {
    it("creates a review with default values", async () => {
      const created = {
        id: "r1",
        rating: 5,
        is_approved: false,
        helpful_count: 0,
      };
      jest.spyOn(service, "createReviews").mockResolvedValue(created);

      const result = await service.createReview({
        rating: 5,
        content: "Great!",
        customer_id: "c1",
        product_id: "p1",
      });
      expect(result).toEqual(created);
    });

    it("throws when rating out of range (too low)", async () => {
      await expect(
        service.createReview({
          rating: 0,
          content: "Bad",
          customer_id: "c1",
          product_id: "p1",
        }),
      ).rejects.toThrow("Rating must be between 1 and 5");
    });

    it("throws when rating out of range (too high)", async () => {
      await expect(
        service.createReview({
          rating: 6,
          content: "Bad",
          customer_id: "c1",
          product_id: "p1",
        }),
      ).rejects.toThrow("Rating must be between 1 and 5");
    });

    it("throws when neither product nor vendor specified", async () => {
      await expect(
        service.createReview({
          rating: 3,
          content: "Test",
          customer_id: "c1",
        }),
      ).rejects.toThrow("Review must be for a product or vendor");
    });

    it("allows vendor review without product_id", async () => {
      jest.spyOn(service, "createReviews").mockResolvedValue({ id: "r1" });

      const result = await service.createReview({
        rating: 4,
        content: "Good vendor",
        customer_id: "c1",
        vendor_id: "v1",
      });
      expect(result.id).toBe("r1");
    });
  });

  describe("listProductReviews", () => {
    it("lists approved reviews by default", async () => {
      const listSpy = jest.spyOn(service, "listReviews").mockResolvedValue([]);

      await service.listProductReviews("p1");
      expect(listSpy).toHaveBeenCalledWith(
        { product_id: "p1", is_approved: true },
        expect.objectContaining({ take: 10, skip: 0 }),
      );
    });

    it("includes unapproved when approved_only is false", async () => {
      const listSpy = jest.spyOn(service, "listReviews").mockResolvedValue([]);

      await service.listProductReviews("p1", { approved_only: false });
      expect(listSpy).toHaveBeenCalledWith(
        { product_id: "p1" },
        expect.any(Object),
      );
    });
  });

  describe("listVendorReviews", () => {
    it("lists approved vendor reviews", async () => {
      const listSpy = jest.spyOn(service, "listReviews").mockResolvedValue([]);

      await service.listVendorReviews("v1");
      expect(listSpy).toHaveBeenCalledWith(
        { vendor_id: "v1", is_approved: true },
        expect.any(Object),
      );
    });
  });

  describe("getProductRatingSummary", () => {
    it("returns zero summary when no reviews", async () => {
      jest.spyOn(service, "listReviews").mockResolvedValue([]);

      const result = await service.getProductRatingSummary("p1");
      expect(result.average_rating).toBe(0);
      expect(result.total_reviews).toBe(0);
      expect(result.rating_distribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      });
    });

    it("calculates correct average and distribution", async () => {
      jest
        .spyOn(service, "listReviews")
        .mockResolvedValue([
          { rating: 5 },
          { rating: 4 },
          { rating: 5 },
          { rating: 3 },
        ]);

      const result = await service.getProductRatingSummary("p1");
      expect(result.average_rating).toBe(4.3);
      expect(result.total_reviews).toBe(4);
      expect(result.rating_distribution[5]).toBe(2);
      expect(result.rating_distribution[4]).toBe(1);
      expect(result.rating_distribution[3]).toBe(1);
    });
  });

  describe("approveReview", () => {
    it("updates review to approved", async () => {
      const updateSpy = jest
        .spyOn(service, "updateReviews")
        .mockResolvedValue({ id: "r1", is_approved: true });

      await service.approveReview("r1");
      expect(updateSpy).toHaveBeenCalledWith({ id: "r1", is_approved: true });
    });
  });

  describe("rejectReview", () => {
    it("deletes the review", async () => {
      const deleteSpy = jest
        .spyOn(service, "deleteReviews")
        .mockResolvedValue({});

      await service.rejectReview("r1");
      expect(deleteSpy).toHaveBeenCalledWith("r1");
    });
  });

  describe("markHelpful", () => {
    it("increments helpful count", async () => {
      jest
        .spyOn(service, "retrieveReview")
        .mockResolvedValue({ id: "r1", helpful_count: 3 });
      const updateSpy = jest
        .spyOn(service, "updateReviews")
        .mockResolvedValue({});

      await service.markHelpful("r1");
      expect(updateSpy).toHaveBeenCalledWith({ id: "r1", helpful_count: 4 });
    });

    it("handles null helpful_count", async () => {
      jest
        .spyOn(service, "retrieveReview")
        .mockResolvedValue({ id: "r1", helpful_count: null });
      const updateSpy = jest
        .spyOn(service, "updateReviews")
        .mockResolvedValue({});

      await service.markHelpful("r1");
      expect(updateSpy).toHaveBeenCalledWith({ id: "r1", helpful_count: 1 });
    });
  });
});
