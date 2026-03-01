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
        async listVendors(_filter: any): Promise<any> {
          return [];
        }
        async retrieveVendor(_id: string): Promise<any> {
          return null;
        }
        async updateVendors(_data: any): Promise<any> {
          return {};
        }
        async listVendorProducts(_filter: any): Promise<any> {
          return [];
        }
        async createVendorProducts(_data: any): Promise<any> {
          return {};
        }
        async listVendorOrders(_filter: any): Promise<any> {
          return [];
        }
        async createVendorOrders(_data: any): Promise<any> {
          return {};
        }
        async createVendorOrderItems(_data: any): Promise<any> {
          return {};
        }
        async updateVendorOrders(_data: any): Promise<any> {
          return {};
        }
        async listVendorAnalyticsSnapshots(_filter: any): Promise<any> {
          return [];
        }
        async createVendorAnalyticsSnapshots(_data: any): Promise<any> {
          return {};
        }
        async updateVendorAnalyticsSnapshots(_data: any): Promise<any> {
          return {};
        }
        async listVendorPerformanceMetrics(_filter: any): Promise<any> {
          return [];
        }
        async createVendorPerformanceMetrics(_data: any): Promise<any> {
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

import VendorModuleService from "../../../src/modules/vendor/service";

describe("VendorModuleService", () => {
  let service: VendorModuleService;

  beforeEach(() => {
    service = new VendorModuleService();
    jest.clearAllMocks();
  });

  describe("generateVendorOrderNumber", () => {
    it("generates order number with vendor handle prefix", async () => {
      jest
        .spyOn(service, "retrieveVendor")
        .mockResolvedValue({ id: "v1", handle: "acme-shop" });

      const result = await service.generateVendorOrderNumber("v1");
      expect(result).toMatch(/^ACME-[A-Z0-9]+$/);
    });

    it("uses VO prefix when handle is missing", async () => {
      jest
        .spyOn(service, "retrieveVendor")
        .mockResolvedValue({ id: "v1", handle: null });

      const result = await service.generateVendorOrderNumber("v1");
      expect(result).toMatch(/^VO-[A-Z0-9]+$/);
    });
  });

  describe("listVendorsByStatus", () => {
    it("lists vendors by status", async () => {
      const spy = jest
        .spyOn(service, "listVendors")
        .mockResolvedValue([{ id: "v1" }]);

      await service.listVendorsByStatus("active");
      expect(spy).toHaveBeenCalledWith({ status: "active" });
    });

    it("includes tenant filter when provided", async () => {
      const spy = jest.spyOn(service, "listVendors").mockResolvedValue([]);

      await service.listVendorsByStatus("active", "tenant-1");
      expect(spy).toHaveBeenCalledWith({
        status: "active",
        tenant_id: "tenant-1",
      });
    });
  });

  describe("approveVendor", () => {
    it("sets vendor as approved and active", async () => {
      const spy = jest.spyOn(service, "updateVendors").mockResolvedValue({});

      await service.approveVendor("v1", "admin-1", "Looks good");

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "v1",
          verification_status: "approved",
          verification_approved_by: "admin-1",
          status: "active",
        }),
      );
    });
  });

  describe("rejectVendor", () => {
    it("sets vendor as rejected", async () => {
      const spy = jest.spyOn(service, "updateVendors").mockResolvedValue({});

      await service.rejectVendor("v1", "admin-1", "Incomplete docs");

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          verification_status: "rejected",
          verification_notes: "Incomplete docs",
        }),
      );
    });
  });

  describe("suspendVendor", () => {
    it("suspends vendor with reason", async () => {
      const spy = jest.spyOn(service, "updateVendors").mockResolvedValue({});

      await service.suspendVendor("v1", "Policy violation");

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "suspended",
          verification_notes: "Policy violation",
        }),
      );
    });
  });

  describe("assignProductToVendor", () => {
    it("assigns product to vendor", async () => {
      jest.spyOn(service, "listVendorProducts").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createVendorProducts")
        .mockResolvedValue({ id: "vp-1" });

      await service.assignProductToVendor("v1", "prod-1", { isPrimary: true });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          vendor_id: "v1",
          product_id: "prod-1",
          is_primary_vendor: true,
          status: "pending_approval",
        }),
      );
    });

    it("throws when product already assigned", async () => {
      jest
        .spyOn(service, "listVendorProducts")
        .mockResolvedValue([{ id: "vp-1" }]);

      await expect(
        service.assignProductToVendor("v1", "prod-1"),
      ).rejects.toThrow("already assigned");
    });

    it("sets commission override when provided", async () => {
      jest.spyOn(service, "listVendorProducts").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createVendorProducts")
        .mockResolvedValue({});

      await service.assignProductToVendor("v1", "prod-1", {
        commissionOverride: 20,
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          commission_override: true,
          commission_rate: 20,
          commission_type: "percentage",
        }),
      );
    });
  });

  describe("getVendorForProduct", () => {
    it("returns primary vendor for product", async () => {
      jest
        .spyOn(service, "listVendorProducts")
        .mockResolvedValue([{ vendor_id: "v1" }]);
      jest
        .spyOn(service, "retrieveVendor")
        .mockResolvedValue({ id: "v1", name: "Acme" });

      const result = await service.getVendorForProduct("prod-1");
      expect(result).toEqual({ id: "v1", name: "Acme" });
    });

    it("returns null when no primary vendor", async () => {
      jest.spyOn(service, "listVendorProducts").mockResolvedValue([]);

      const result = await service.getVendorForProduct("prod-1");
      expect(result).toBeNull();
    });
  });

  describe("getVendorProducts", () => {
    it("returns products for vendor", async () => {
      jest
        .spyOn(service, "listVendorProducts")
        .mockResolvedValue([{ id: "vp-1" }, { id: "vp-2" }]);

      const result = await service.getVendorProducts("v1");
      expect(result).toHaveLength(2);
    });

    it("filters by status when provided", async () => {
      const spy = jest
        .spyOn(service, "listVendorProducts")
        .mockResolvedValue([]);

      await service.getVendorProducts("v1", "approved");
      expect(spy).toHaveBeenCalledWith({ vendor_id: "v1", status: "approved" });
    });
  });

  describe("createVendorOrderFromOrder", () => {
    it("creates vendor order with commission calculations", async () => {
      jest
        .spyOn(service, "generateVendorOrderNumber")
        .mockResolvedValue("ACME-123");
      const createOrderSpy = jest
        .spyOn(service, "createVendorOrders")
        .mockResolvedValue({ id: "vo-1" });
      jest.spyOn(service, "createVendorOrderItems").mockResolvedValue({});

      const items = [
        {
          lineItemId: "li-1",
          productId: "prod-1",
          title: "Widget",
          quantity: 2,
          unitPrice: 1000,
        },
      ];

      await service.createVendorOrderFromOrder(
        "v1",
        "ord-1",
        items,
        { city: "Test" },
        10,
      );

      expect(createOrderSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          vendor_id: "v1",
          order_id: "ord-1",
          subtotal: 2000,
          total: 2000,
          commission_amount: 200,
          net_amount: 1800,
        }),
      );
    });
  });

  describe("updateVendorOrderStatus", () => {
    it("sets shipped status with tracking info", async () => {
      const spy = jest
        .spyOn(service, "updateVendorOrders")
        .mockResolvedValue({});

      await service.updateVendorOrderStatus("vo-1", "shipped", {
        trackingNumber: "TRK123",
        trackingUrl: "https://track.example.com/TRK123",
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "shipped",
          tracking_number: "TRK123",
          tracking_url: "https://track.example.com/TRK123",
        }),
      );
    });

    it("sets delivered status with fulfillment", async () => {
      const spy = jest
        .spyOn(service, "updateVendorOrders")
        .mockResolvedValue({});

      await service.updateVendorOrderStatus("vo-1", "delivered");

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "delivered",
          fulfillment_status: "fulfilled",
        }),
      );
    });

    it("sets completed status with fulfillment", async () => {
      const spy = jest
        .spyOn(service, "updateVendorOrders")
        .mockResolvedValue({});

      await service.updateVendorOrderStatus("vo-1", "completed");

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
          fulfillment_status: "fulfilled",
        }),
      );
    });
  });

  describe("getPendingVendorOrders", () => {
    it("returns pending orders for vendor", async () => {
      jest
        .spyOn(service, "listVendorOrders")
        .mockResolvedValue([{ id: "vo-1" }]);

      const result = await service.getPendingVendorOrders("v1");
      expect(result).toHaveLength(1);
    });
  });

  describe("getVendorOrdersAwaitingPayout", () => {
    it("returns completed orders with pending payout", async () => {
      jest
        .spyOn(service, "listVendorOrders")
        .mockResolvedValue([{ id: "vo-1" }]);

      const result = await service.getVendorOrdersAwaitingPayout("v1");
      expect(result).toHaveLength(1);
    });
  });

  describe("calculateVendorAnalytics", () => {
    it("creates analytics snapshot when none exists", async () => {
      jest.spyOn(service, "listVendorOrders").mockResolvedValue([
        {
          id: "vo-1",
          status: "completed",
          total: 5000,
          net_amount: 4250,
          commission_amount: 750,
          created_at: "2025-01-15",
        },
        {
          id: "vo-2",
          status: "cancelled",
          total: 2000,
          net_amount: 1700,
          commission_amount: 300,
          created_at: "2025-01-20",
        },
      ]);
      jest.spyOn(service, "getVendorProducts").mockResolvedValue([
        { id: "vp-1", status: "approved" },
        { id: "vp-2", status: "pending" },
      ]);
      jest.spyOn(service, "listVendorAnalyticsSnapshots").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createVendorAnalyticsSnapshots")
        .mockResolvedValue({});

      await service.calculateVendorAnalytics(
        "v1",
        "monthly",
        new Date("2025-01-01"),
        new Date("2025-01-31"),
      );

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          total_orders: 2,
          completed_orders: 1,
          cancelled_orders: 1,
          total_products: 2,
          active_products: 1,
        }),
      );
    });

    it("updates existing analytics snapshot", async () => {
      jest.spyOn(service, "listVendorOrders").mockResolvedValue([]);
      jest.spyOn(service, "getVendorProducts").mockResolvedValue([]);
      jest
        .spyOn(service, "listVendorAnalyticsSnapshots")
        .mockResolvedValue([{ id: "snap-1" }]);
      const updateSpy = jest
        .spyOn(service, "updateVendorAnalyticsSnapshots")
        .mockResolvedValue({});

      await service.calculateVendorAnalytics(
        "v1",
        "monthly",
        new Date("2025-01-01"),
        new Date("2025-01-31"),
      );

      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe("calculateVendorPerformanceMetrics", () => {
    it("returns empty when no orders", async () => {
      jest.spyOn(service, "listVendorOrders").mockResolvedValue([]);

      const result = await service.calculateVendorPerformanceMetrics("v1", 30);
      expect(result).toEqual([]);
    });

    it("calculates cancellation and return rates", async () => {
      const recentDate = new Date().toISOString();
      jest.spyOn(service, "listVendorOrders").mockResolvedValue([
        { id: "vo-1", status: "completed", created_at: recentDate },
        { id: "vo-2", status: "cancelled", created_at: recentDate },
        { id: "vo-3", status: "returned", created_at: recentDate },
        { id: "vo-4", status: "completed", created_at: recentDate },
      ]);
      jest
        .spyOn(service, "createVendorPerformanceMetrics")
        .mockResolvedValue({});

      const result = await service.calculateVendorPerformanceMetrics("v1", 30);

      expect(result).toHaveLength(3);
      const cancellation = result.find(
        (m: any) => m.metric_type === "cancellation_rate",
      );
      expect(cancellation.value).toBe(25);
      const returnRate = result.find(
        (m: any) => m.metric_type === "return_rate",
      );
      expect(returnRate.value).toBe(25);
    });
  });

  describe("getVendorDashboard", () => {
    it("returns comprehensive dashboard data", async () => {
      jest.spyOn(service, "retrieveVendor").mockResolvedValue({
        id: "v1",
        total_orders: 50,
        total_sales: 100000,
      });
      jest
        .spyOn(service, "listVendorOrders")
        .mockResolvedValue([{ id: "vo-1" }]);
      jest
        .spyOn(service, "getPendingVendorOrders")
        .mockResolvedValue([{ id: "vo-2" }]);
      jest
        .spyOn(service, "getVendorProducts")
        .mockResolvedValue([{ id: "vp-1", status: "approved" }]);
      jest
        .spyOn(service, "listVendorAnalyticsSnapshots")
        .mockResolvedValue([{ id: "snap-1" }]);
      jest.spyOn(service, "listVendorPerformanceMetrics").mockResolvedValue([]);

      const result = await service.getVendorDashboard("v1");

      expect(result.vendor.id).toBe("v1");
      expect(result.summary.totalProducts).toBe(1);
      expect(result.summary.pendingOrders).toBe(1);
      expect(result.analytics).toEqual({ id: "snap-1" });
    });
  });
});
