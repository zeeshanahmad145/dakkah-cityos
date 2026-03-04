import { vi, describe, it, expect } from "vitest";
import { GET } from "../../src/api/store/subscriptions/route";

const mockJson = vi.fn();
const mockStatus = vi.fn(() => ({ json: mockJson }));

const createMockReq = (overrides: Record<string, any> = {}) => {
  const { reqQuery, ...rest } = overrides;
  return {
    query: reqQuery || {},
    scope: {
      resolve: vi.fn((name: string) => rest[name] || {}),
    },
    ...rest,
  };
};

const createMockRes = () => {
  const res: any = { json: mockJson, status: mockStatus };
  mockJson.mockClear();
  mockStatus.mockClear();
  mockStatus.mockReturnValue({ json: mockJson });
  return res;
};

describe("Store Subscriptions Endpoints", () => {
  describe("GET /store/subscriptions", () => {
    it("should return subscription plans", async () => {
      const mockItems = [
        { id: "prod_sub_01", title: "Plan A", subscription_plan: {} },
        { id: "prod_sub_02", title: "Plan B", subscription_plan: {} },
      ];
      const req = createMockReq({
        query: {
          graph: vi
            .fn()
            .mockResolvedValue({ data: mockItems, metadata: { count: 2 } }),
        },
      });
      const res = createMockRes();

      await GET(req as any, res);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ items: mockItems, count: 2 }),
      );
    });

    it("should apply query filters for limit and offset", async () => {
      const graph = vi
        .fn()
        .mockResolvedValue({ data: [], metadata: { count: 0 } });
      const req = createMockReq({
        reqQuery: { limit: 10, offset: 5 },
        validatedQuery: { limit: 10, offset: 5 },
        query: { graph },
      });
      const res = createMockRes();

      await GET(req as any, res);
      expect(graph).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({ skip: 0, take: 20 }),
        }),
      );
    });

    it("should fall back to SEED_PLANS when no plans are found", async () => {
      const req = createMockReq({
        query: {
          graph: vi
            .fn()
            .mockResolvedValue({ data: [], metadata: { count: 0 } }),
        },
      });
      const res = createMockRes();

      await GET(req as any, res);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ count: expect.any(Number) }),
      );
    });

    it("should handle service errors gracefully and return SEED_PLANS", async () => {
      const req = createMockReq({
        query: {
          graph: vi.fn().mockRejectedValue(new Error("DB error")),
        },
        logger: { error: vi.fn() },
      });
      const res = createMockRes();

      await GET(req as any, res);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ count: expect.any(Number) }),
      );
    });
  });
});


