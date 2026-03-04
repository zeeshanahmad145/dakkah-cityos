import { vi, describe, it, expect } from "vitest";
import { GET, POST } from "../../src/api/store/quotes/route";

const mockJson = vi.fn();
const mockStatus = vi.fn(() => ({ json: mockJson }));

const createMockReq = (overrides: Record<string, any> = {}) => ({
  query: {},
  body: {},
  auth_context: { actor_id: "cust_01" },
  scope: {
    resolve: vi.fn((name: string) => overrides[name] || {}),
  },
  ...overrides,
});

const createMockRes = () => {
  const res: any = { json: mockJson, status: mockStatus };
  mockJson.mockClear();
  mockStatus.mockClear();
  mockStatus.mockReturnValue({ json: mockJson });
  return res;
};

describe("Store Quotes Endpoints", () => {
  describe("POST /store/quotes", () => {
    const validBody = {
      items: [
        {
          product_id: "prod_01",
          title: "Widget",
          quantity: 5,
          unit_price: 1000,
        },
      ],
      customer_notes: "Need bulk discount",
    };

    it("should create a quote for authenticated customer", async () => {
      const mockQuote = {
        id: "quote_01",
        status: "draft",
      };
      const quoteModuleService = {
        generateQuoteNumber: vi.fn().mockResolvedValue("Q-2026-001"),
        createQuotes: vi.fn().mockResolvedValue(mockQuote),
        createQuoteItems: vi.fn().mockResolvedValue({ id: "qi_01" }),
        calculateQuoteTotals: vi.fn().mockResolvedValue(undefined),
        retrieveQuote: vi.fn().mockResolvedValue({ ...mockQuote, items: [] }),
      };
      const req = createMockReq({ body: validBody, quote: quoteModuleService });
      const res = createMockRes();

      await POST(req as any, res);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ quote: expect.any(Object) }),
      );
    });

    it("should return 401 when not authenticated", async () => {
      const req = createMockReq({ body: validBody, auth_context: {} });
      const res = createMockRes();

      await POST(req as any, res);
      expect(mockStatus).toHaveBeenCalledWith(401);
    });

    it("should generate a quote number", async () => {
      const generateQuoteNumber = vi.fn().mockResolvedValue("Q-2026-002");
      const quoteModuleService = {
        generateQuoteNumber,
        createQuotes: vi.fn().mockResolvedValue({ id: "quote_02" }),
        createQuoteItems: vi.fn().mockResolvedValue({}),
        calculateQuoteTotals: vi.fn(),
        retrieveQuote: vi.fn().mockResolvedValue({ id: "quote_02", items: [] }),
      };
      const req = createMockReq({ body: validBody, quote: quoteModuleService });
      const res = createMockRes();

      await POST(req as any, res);
      expect(generateQuoteNumber).toHaveBeenCalled();
    });

    it("should create quote items for each item in the request", async () => {
      const createQuoteItems = vi.fn().mockResolvedValue({});
      const quoteModuleService = {
        generateQuoteNumber: vi.fn().mockResolvedValue("Q-001"),
        createQuotes: vi.fn().mockResolvedValue({ id: "quote_03" }),
        createQuoteItems,
        calculateQuoteTotals: vi.fn(),
        retrieveQuote: vi.fn().mockResolvedValue({ id: "quote_03", items: [] }),
      };
      const body = {
        items: [
          { product_id: "prod_01", title: "A", quantity: 1, unit_price: 100 },
          { product_id: "prod_02", title: "B", quantity: 2, unit_price: 200 },
        ],
      };
      const req = createMockReq({ body, quote: quoteModuleService });
      const res = createMockRes();

      await POST(req as any, res);
      expect(createQuoteItems).toHaveBeenCalledTimes(2);
    });
  });

  describe("GET /store/quotes", () => {
    it("should list quotes for authenticated customer", async () => {
      const mockQuotes = [{ id: "quote_01" }, { id: "quote_02" }];
      const quoteModuleService = {
        listQuotes: vi.fn().mockResolvedValue(mockQuotes),
      };
      const req = createMockReq({ quote: quoteModuleService });
      const res = createMockRes();

      await GET(req as any, res);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ quotes: mockQuotes, count: 2 }),
      );
    });

    it("should return seed quotes when not authenticated", async () => {
      const req = createMockReq({ auth_context: {} });
      const res = createMockRes();

      await GET(req as any, res);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ count: 5 }),
      );
    });

    it("should filter quotes by customer_id", async () => {
      const listQuotes = vi.fn().mockResolvedValue([]);
      const quoteModuleService = { listQuotes };
      const req = createMockReq({ quote: quoteModuleService });
      const res = createMockRes();

      await GET(req as any, res);
      expect(listQuotes).toHaveBeenCalledWith(
        { customer_id: "cust_01" },
        expect.anything(),
      );
    });
  });
});
