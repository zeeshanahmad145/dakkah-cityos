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
        async listAnalyticsEvents(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async retrieveAnalyticsEvent(_id: string): Promise<any> {
          return null;
        }
        async createAnalyticsEvents(_data: any): Promise<any> {
          return {};
        }
        async updateAnalyticsEvents(_data: any): Promise<any> {
          return {};
        }
        async listReports(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async retrieveReport(_id: string): Promise<any> {
          return null;
        }
        async updateReports(_data: any): Promise<any> {
          return {};
        }
        async listDashboards(_filter: any, _options?: any): Promise<any> {
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
    Module: (_config: any) => ({}),
  };
});

import AnalyticsModuleService from "../../../src/modules/analytics/service";

describe("AnalyticsModuleService – Enhanced", () => {
  let service: AnalyticsModuleService;

  beforeEach(() => {
    service = new AnalyticsModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("getSalesMetrics", () => {
    it("returns revenue, orderCount and avgOrderValue for matching events", async () => {
      const now = new Date();
      vi.spyOn(service, "listAnalyticsEvents").mockResolvedValue([
        {
          event_type: "purchase",
          revenue: 1000,
          created_at: now.toISOString(),
        },
        {
          event_type: "purchase",
          revenue: 2000,
          created_at: now.toISOString(),
        },
      ]);

      const start = new Date(now.getTime() - 86400000);
      const end = new Date(now.getTime() + 86400000);
      const result = await service.getSalesMetrics("tenant-1", { start, end });

      expect(result.revenue).toBe(3000);
      expect(result.orderCount).toBe(2);
      expect(result.avgOrderValue).toBe(1500);
    });

    it("returns zero metrics when no purchase events exist", async () => {
      vi.spyOn(service, "listAnalyticsEvents").mockResolvedValue([]);

      const result = await service.getSalesMetrics("tenant-1", {
        start: new Date(),
        end: new Date(),
      });

      expect(result.revenue).toBe(0);
      expect(result.orderCount).toBe(0);
      expect(result.avgOrderValue).toBe(0);
    });

    it("filters events outside date range", async () => {
      const old = new Date("2020-01-01");
      jest
        .spyOn(service, "listAnalyticsEvents")
        .mockResolvedValue([
          {
            event_type: "purchase",
            revenue: 500,
            created_at: old.toISOString(),
          },
        ]);

      const start = new Date("2025-01-01");
      const end = new Date("2025-12-31");
      const result = await service.getSalesMetrics("tenant-1", { start, end });

      expect(result.orderCount).toBe(0);
      expect(result.revenue).toBe(0);
    });
  });

  describe("getEventCounts", () => {
    it("counts events of a specific type within date range", async () => {
      const now = new Date();
      vi.spyOn(service, "listAnalyticsEvents").mockResolvedValue([
        { event_type: "page_view", created_at: now.toISOString() },
        { event_type: "page_view", created_at: now.toISOString() },
        { event_type: "page_view", created_at: now.toISOString() },
      ]);

      const start = new Date(now.getTime() - 86400000);
      const end = new Date(now.getTime() + 86400000);
      const result = await service.getEventCounts("tenant-1", "page_view", {
        start,
        end,
      });

      expect(result.count).toBe(3);
      expect(result.event_type).toBe("page_view");
    });

    it("returns zero when no events match", async () => {
      vi.spyOn(service, "listAnalyticsEvents").mockResolvedValue([]);

      const result = await service.getEventCounts("tenant-1", "click", {
        start: new Date(),
        end: new Date(),
      });

      expect(result.count).toBe(0);
    });
  });

  describe("getConversionFunnel (cohort analysis)", () => {
    it("returns funnel steps with conversion rates", async () => {
      const now = new Date();
      const start = new Date(now.getTime() - 86400000);
      const end = new Date(now.getTime() + 86400000);

      jest
        .spyOn(service, "listAnalyticsEvents")
        .mockImplementation(async (filter: any) => {
          const counts: Record<string, number> = {
            page_view: 100,
            product_view: 50,
            add_to_cart: 20,
            checkout_started: 10,
            purchase: 5,
          };
          const count = counts[filter.event_type] || 0;
          return Array.from({ length: count }, () => ({
            event_type: filter.event_type,
            created_at: now.toISOString(),
          }));
        });

      const result = await service.getConversionFunnel("tenant-1", {
        start,
        end,
      });

      expect(result.steps).toHaveLength(5);
      expect(result.steps[0].step).toBe("page_view");
      expect(result.steps[0].count).toBe(100);
      expect(result.overallConversion).toBe(5);
    });

    it("handles zero page views gracefully", async () => {
      vi.spyOn(service, "listAnalyticsEvents").mockResolvedValue([]);

      const result = await service.getConversionFunnel("tenant-1", {
        start: new Date(),
        end: new Date(),
      });

      expect(result.overallConversion).toBe(0);
      expect(result.steps).toHaveLength(5);
    });

    it("calculates step-over-step conversion rates", async () => {
      const now = new Date();
      const start = new Date(now.getTime() - 86400000);
      const end = new Date(now.getTime() + 86400000);

      jest
        .spyOn(service, "listAnalyticsEvents")
        .mockImplementation(async (filter: any) => {
          const counts: Record<string, number> = {
            page_view: 200,
            product_view: 100,
            add_to_cart: 50,
            checkout_started: 25,
            purchase: 10,
          };
          const count = counts[filter.event_type] || 0;
          return Array.from({ length: count }, () => ({
            event_type: filter.event_type,
            created_at: now.toISOString(),
          }));
        });

      const result = await service.getConversionFunnel("tenant-1", {
        start,
        end,
      });

      expect(result.steps[1].conversionRate).toBe(50);
    });
  });
});
