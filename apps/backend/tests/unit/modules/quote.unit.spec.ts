jest.mock("@medusajs/framework/utils", () => {
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
        async listQuotes(_filter: any): Promise<any> {
          return [];
        }
        async retrieveQuote(_id: string): Promise<any> {
          return null;
        }
        async createQuotes(_data: any): Promise<any> {
          return {};
        }
        async updateQuotes(_data: any): Promise<any> {
          return {};
        }
        async listQuoteItems(_filter: any): Promise<any> {
          return [];
        }
        async createQuoteItems(_data: any): Promise<any> {
          return {};
        }
        async updateQuoteItems(_data: any): Promise<any> {
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

import QuoteModuleService from "../../../src/modules/quote/service";

describe("QuoteModuleService", () => {
  let service: QuoteModuleService;

  beforeEach(() => {
    service = new QuoteModuleService();
    jest.clearAllMocks();
  });

  describe("generateQuoteNumber", () => {
    it("generates a sequential quote number", async () => {
      jest
        .spyOn(service, "listQuotes")
        .mockResolvedValue([{ id: "q1" }, { id: "q2" }, { id: "q3" }]);

      const result = await service.generateQuoteNumber();

      const year = new Date().getFullYear();
      expect(result).toBe(`Q-${year}-0004`);
    });

    it("starts at 0001 when no quotes exist", async () => {
      jest.spyOn(service, "listQuotes").mockResolvedValue([]);

      const result = await service.generateQuoteNumber();

      const year = new Date().getFullYear();
      expect(result).toBe(`Q-${year}-0001`);
    });
  });

  describe("calculateQuoteTotals", () => {
    it("calculates totals from line items", async () => {
      jest.spyOn(service, "listQuoteItems").mockResolvedValue([
        {
          id: "qi-1",
          unit_price: "1000",
          quantity: 2,
          discount_total: "100",
          tax_total: "180",
        },
        {
          id: "qi-2",
          unit_price: "500",
          quantity: 3,
          custom_unit_price: "450",
          discount_total: "0",
          tax_total: "135",
        },
      ]);
      const updateItemSpy = jest
        .spyOn(service, "updateQuoteItems")
        .mockResolvedValue({});
      const updateQuoteSpy = jest
        .spyOn(service, "updateQuotes")
        .mockResolvedValue({});

      await service.calculateQuoteTotals("q-1");

      expect(updateItemSpy).toHaveBeenCalledTimes(2);
      expect(updateQuoteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "q-1",
        }),
      );
    });

    it("handles empty line items", async () => {
      jest.spyOn(service, "listQuoteItems").mockResolvedValue([]);
      const updateQuoteSpy = jest
        .spyOn(service, "updateQuotes")
        .mockResolvedValue({});

      await service.calculateQuoteTotals("q-1");

      expect(updateQuoteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: "0",
          total: "0",
        }),
      );
    });
  });

  describe("isQuoteValid", () => {
    it("returns true when quote has no expiry", async () => {
      jest
        .spyOn(service, "retrieveQuote")
        .mockResolvedValue({ id: "q-1", valid_until: null });

      const result = await service.isQuoteValid("q-1");

      expect(result).toBe(true);
    });

    it("returns true when quote has not expired", async () => {
      jest
        .spyOn(service, "retrieveQuote")
        .mockResolvedValue({ id: "q-1", valid_until: "2099-12-31" });

      const result = await service.isQuoteValid("q-1");

      expect(result).toBe(true);
    });

    it("returns false when quote has expired", async () => {
      jest
        .spyOn(service, "retrieveQuote")
        .mockResolvedValue({ id: "q-1", valid_until: "2020-01-01" });

      const result = await service.isQuoteValid("q-1");

      expect(result).toBe(false);
    });
  });

  describe("applyCustomDiscount", () => {
    it("applies a percentage discount", async () => {
      jest.spyOn(service, "retrieveQuote").mockResolvedValue({
        id: "q-1",
        subtotal: "10000",
        tax_total: "900",
      });
      const updateSpy = jest
        .spyOn(service, "updateQuotes")
        .mockResolvedValue({});

      await service.applyCustomDiscount("q-1", "percentage", 10, "Bulk order");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "q-1",
          custom_discount_percentage: 10,
          discount_reason: "Bulk order",
        }),
      );
    });

    it("applies a fixed discount", async () => {
      jest.spyOn(service, "retrieveQuote").mockResolvedValue({
        id: "q-1",
        subtotal: "10000",
        tax_total: "900",
      });
      const updateSpy = jest
        .spyOn(service, "updateQuotes")
        .mockResolvedValue({});

      await service.applyCustomDiscount("q-1", "fixed", 500);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "q-1",
          custom_discount_amount: "500",
          custom_discount_percentage: null,
        }),
      );
    });
  });

  describe("createCartFromQuote", () => {
    it("converts quote items to cart items", async () => {
      jest.spyOn(service, "retrieveQuote").mockResolvedValue({
        id: "q-1",
        quote_number: "Q-2026-0001",
      });
      jest.spyOn(service, "listQuoteItems").mockResolvedValue([
        {
          id: "qi-1",
          variant_id: "var-1",
          quantity: 2,
          unit_price: "1000",
          custom_unit_price: "900",
        },
        {
          id: "qi-2",
          variant_id: "var-2",
          quantity: 1,
          unit_price: "500",
          custom_unit_price: null,
        },
      ]);

      const result = await service.createCartFromQuote("q-1");

      expect(result.items).toHaveLength(2);
      expect(result.items[0].unit_price).toBe("900");
      expect(result.items[1].unit_price).toBe("500");
      expect(result.metadata.quote_id).toBe("q-1");
      expect(result.items[0].metadata.from_quote).toBe(true);
    });
  });
});
