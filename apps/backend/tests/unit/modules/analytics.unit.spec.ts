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
        async listAnalyticsEvents(_filter: any, _config?: any): Promise<any> {
          return [];
        }
        async createAnalyticsEvents(_data: any): Promise<any> {
          return {};
        }
        async retrieveReport(_id: string): Promise<any> {
          return null;
        }
        async updateReports(_data: any): Promise<any> {
          return {};
        }
        async listDashboards(_filter: any): Promise<any> {
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

import AnalyticsModuleService from "../../../src/modules/analytics/service";

describe("AnalyticsModuleService", () => {
  let service: AnalyticsModuleService;

  beforeEach(() => {
    service = new AnalyticsModuleService();
    jest.clearAllMocks();
  });

  describe("trackEvent", () => {
    it("creates an analytics event", async () => {
      const createSpy = jest
        .spyOn(service, "createAnalyticsEvents")
        .mockResolvedValue({ id: "ev-1" });

      const result = await service.trackEvent({
        tenant_id: "t1",
        event_type: "purchase",
        entity_type: "product",
        entity_id: "prod-1",
        revenue: 99.99,
      });

      expect(result).toEqual({ id: "ev-1" });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: "t1",
          event_type: "purchase",
          entity_type: "product",
        }),
      );
    });
  });

  describe("getEventCounts", () => {
    it("counts events within date range", async () => {
      jest.spyOn(service, "listAnalyticsEvents").mockResolvedValue([
        { event_type: "page_view", created_at: "2025-01-15T00:00:00Z" },
        { event_type: "page_view", created_at: "2025-01-20T00:00:00Z" },
        { event_type: "page_view", created_at: "2025-02-15T00:00:00Z" },
      ]);

      const result = await service.getEventCounts("t1", "page_view", {
        start: new Date("2025-01-01"),
        end: new Date("2025-01-31"),
      });

      expect(result.count).toBe(2);
      expect(result.event_type).toBe("page_view");
    });

    it("returns zero count when no events match", async () => {
      jest.spyOn(service, "listAnalyticsEvents").mockResolvedValue([]);

      const result = await service.getEventCounts("t1", "page_view", {
        start: new Date("2025-01-01"),
        end: new Date("2025-01-31"),
      });

      expect(result.count).toBe(0);
    });
  });

  describe("getSalesMetrics", () => {
    it("calculates revenue and average order value", async () => {
      jest.spyOn(service, "listAnalyticsEvents").mockResolvedValue([
        {
          event_type: "purchase",
          revenue: 100,
          created_at: "2025-01-10T00:00:00Z",
        },
        {
          event_type: "purchase",
          revenue: 200,
          created_at: "2025-01-15T00:00:00Z",
        },
      ]);

      const result = await service.getSalesMetrics("t1", {
        start: new Date("2025-01-01"),
        end: new Date("2025-01-31"),
      });

      expect(result.revenue).toBe(300);
      expect(result.orderCount).toBe(2);
      expect(result.avgOrderValue).toBe(150);
    });

    it("returns zero metrics when no purchases", async () => {
      jest.spyOn(service, "listAnalyticsEvents").mockResolvedValue([]);

      const result = await service.getSalesMetrics("t1", {
        start: new Date("2025-01-01"),
        end: new Date("2025-01-31"),
      });

      expect(result.revenue).toBe(0);
      expect(result.orderCount).toBe(0);
      expect(result.avgOrderValue).toBe(0);
    });
  });

  describe("getTopProducts", () => {
    it("returns products sorted by revenue", async () => {
      jest.spyOn(service, "listAnalyticsEvents").mockResolvedValue([
        {
          entity_type: "product",
          entity_id: "p1",
          revenue: 100,
          created_at: "2025-01-10T00:00:00Z",
        },
        {
          entity_type: "product",
          entity_id: "p1",
          revenue: 200,
          created_at: "2025-01-11T00:00:00Z",
        },
        {
          entity_type: "product",
          entity_id: "p2",
          revenue: 500,
          created_at: "2025-01-12T00:00:00Z",
        },
      ]);

      const result = await service.getTopProducts("t1", 10, {
        start: new Date("2025-01-01"),
        end: new Date("2025-01-31"),
      });

      expect(result[0].product_id).toBe("p2");
      expect(result[0].revenue).toBe(500);
      expect(result[1].product_id).toBe("p1");
      expect(result[1].revenue).toBe(300);
    });
  });

  describe("trackPageView", () => {
    it("creates a page view event", async () => {
      const createSpy = jest
        .spyOn(service, "createAnalyticsEvents")
        .mockResolvedValue({ id: "ev-1" });

      await service.trackPageView({
        sessionId: "sess-1",
        pageUrl: "/products",
        tenantId: "t1",
        deviceType: "desktop",
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: "page_view",
          session_id: "sess-1",
        }),
      );
    });

    it("throws when required fields are missing", async () => {
      await expect(
        service.trackPageView({
          sessionId: "",
          pageUrl: "/products",
          tenantId: "t1",
        }),
      ).rejects.toThrow("Session ID, page URL, and tenant ID are required");
    });
  });

  describe("generateReport", () => {
    it("updates report generation timestamp", async () => {
      jest
        .spyOn(service, "retrieveReport")
        .mockResolvedValue({ id: "r1", title: "Monthly" });
      const updateSpy = jest
        .spyOn(service, "updateReports")
        .mockResolvedValue({});

      await service.generateReport("r1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "r1",
        }),
      );
    });
  });

  describe("getDashboard", () => {
    it("returns dashboard by slug", async () => {
      jest
        .spyOn(service, "listDashboards")
        .mockResolvedValue([{ id: "d1", slug: "overview", tenant_id: "t1" }]);

      const result = await service.getDashboard("t1", "overview");
      expect(result).toEqual(
        expect.objectContaining({ id: "d1", slug: "overview" }),
      );
    });

    it("throws when dashboard not found", async () => {
      jest.spyOn(service, "listDashboards").mockResolvedValue([]);

      await expect(service.getDashboard("t1", "nonexistent")).rejects.toThrow(
        'Dashboard "nonexistent" not found',
      );
    });
  });
});
