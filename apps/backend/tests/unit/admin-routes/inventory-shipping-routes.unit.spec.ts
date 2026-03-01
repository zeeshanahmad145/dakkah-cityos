import { GET as listStockAlerts } from "../../../src/api/admin/inventory-ext/stock-alerts/route";
import { GET as listTransfers } from "../../../src/api/admin/inventory-ext/transfers/route";
import {
  GET as listCarriers,
  POST as createCarrier,
} from "../../../src/api/admin/shipping-ext/carriers/route";

const createRes = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return res;
};

describe("Admin Inventory Extension Routes", () => {
  describe("GET /admin/inventory-ext/stock-alerts", () => {
    const createMockService = () => ({
      listStockAlerts: jest.fn(),
    });

    const createReq = (mockService: any, overrides: any = {}) => ({
      scope: { resolve: jest.fn(() => mockService) },
      query: {},
      params: {},
      body: {},
      ...overrides,
    });

    it("should list stock alerts with no filters", async () => {
      const mockService = createMockService();
      const alerts = [{ id: "alert_1", alert_type: "low_stock" }];
      mockService.listStockAlerts.mockResolvedValue(alerts);
      const req = createReq(mockService);
      const res = createRes();

      await listStockAlerts(req, res);

      expect(mockService.listStockAlerts).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({ alerts });
    });

    it("should filter by alert_type", async () => {
      const mockService = createMockService();
      mockService.listStockAlerts.mockResolvedValue([]);
      const req = createReq(mockService, {
        query: { alert_type: "out_of_stock" },
      });
      const res = createRes();

      await listStockAlerts(req, res);

      expect(mockService.listStockAlerts).toHaveBeenCalledWith({
        alert_type: "out_of_stock",
      });
    });

    it("should filter by is_resolved=true", async () => {
      const mockService = createMockService();
      mockService.listStockAlerts.mockResolvedValue([]);
      const req = createReq(mockService, { query: { is_resolved: "true" } });
      const res = createRes();

      await listStockAlerts(req, res);

      expect(mockService.listStockAlerts).toHaveBeenCalledWith({
        is_resolved: true,
      });
    });

    it("should filter by is_resolved=false", async () => {
      const mockService = createMockService();
      mockService.listStockAlerts.mockResolvedValue([]);
      const req = createReq(mockService, { query: { is_resolved: "false" } });
      const res = createRes();

      await listStockAlerts(req, res);

      expect(mockService.listStockAlerts).toHaveBeenCalledWith({
        is_resolved: false,
      });
    });

    it("should handle non-array result", async () => {
      const mockService = createMockService();
      mockService.listStockAlerts.mockResolvedValue({ id: "alert_1" });
      const req = createReq(mockService);
      const res = createRes();

      await listStockAlerts(req, res);

      expect(res.json).toHaveBeenCalledWith({ alerts: [{ id: "alert_1" }] });
    });

    it("should return 400 on error", async () => {
      const mockService = createMockService();
      mockService.listStockAlerts.mockRejectedValue(new Error("DB error"));
      const req = createReq(mockService);
      const res = createRes();

      await listStockAlerts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("GET /admin/inventory-ext/transfers", () => {
    const createMockService = () => ({
      listWarehouseTransfers: jest.fn(),
    });

    const createReq = (mockService: any, overrides: any = {}) => ({
      scope: { resolve: jest.fn(() => mockService) },
      query: {},
      params: {},
      body: {},
      ...overrides,
    });

    it("should list transfers with no filters", async () => {
      const mockService = createMockService();
      const transfers = [{ id: "xfer_1" }];
      mockService.listWarehouseTransfers.mockResolvedValue(transfers);
      const req = createReq(mockService);
      const res = createRes();

      await listTransfers(req, res);

      expect(mockService.listWarehouseTransfers).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({ transfers });
    });

    it("should filter by status", async () => {
      const mockService = createMockService();
      mockService.listWarehouseTransfers.mockResolvedValue([]);
      const req = createReq(mockService, { query: { status: "pending" } });
      const res = createRes();

      await listTransfers(req, res);

      expect(mockService.listWarehouseTransfers).toHaveBeenCalledWith({
        status: "pending",
      });
    });

    it("should return 400 on error", async () => {
      const mockService = createMockService();
      mockService.listWarehouseTransfers.mockRejectedValue(new Error("Error"));
      const req = createReq(mockService);
      const res = createRes();

      await listTransfers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

describe("Admin Shipping Extension Routes", () => {
  describe("GET /admin/shipping-ext/carriers", () => {
    const createMockService = () => ({
      listCarrierConfigs: jest.fn(),
      createCarrierConfigs: jest.fn(),
    });

    const createReq = (mockService: any, overrides: any = {}) => ({
      scope: { resolve: jest.fn(() => mockService) },
      query: {},
      params: {},
      body: {},
      ...overrides,
    });

    it("should list carriers with no filters", async () => {
      const mockService = createMockService();
      const carriers = [{ id: "carrier_1", name: "FedEx" }];
      mockService.listCarrierConfigs.mockResolvedValue(carriers);
      const req = createReq(mockService);
      const res = createRes();

      await listCarriers(req, res);

      expect(mockService.listCarrierConfigs).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({ carriers });
    });

    it("should filter by is_active=true", async () => {
      const mockService = createMockService();
      mockService.listCarrierConfigs.mockResolvedValue([]);
      const req = createReq(mockService, { query: { is_active: "true" } });
      const res = createRes();

      await listCarriers(req, res);

      expect(mockService.listCarrierConfigs).toHaveBeenCalledWith({
        is_active: true,
      });
    });

    it("should filter by is_active=false", async () => {
      const mockService = createMockService();
      mockService.listCarrierConfigs.mockResolvedValue([]);
      const req = createReq(mockService, { query: { is_active: "false" } });
      const res = createRes();

      await listCarriers(req, res);

      expect(mockService.listCarrierConfigs).toHaveBeenCalledWith({
        is_active: false,
      });
    });

    it("should return 400 on error", async () => {
      const mockService = createMockService();
      mockService.listCarrierConfigs.mockRejectedValue(new Error("Error"));
      const req = createReq(mockService);
      const res = createRes();

      await listCarriers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("POST /admin/shipping-ext/carriers", () => {
    const createMockService = () => ({
      listCarrierConfigs: jest.fn(),
      createCarrierConfigs: jest.fn(),
    });

    const createReq = (mockService: any, overrides: any = {}) => ({
      scope: { resolve: jest.fn(() => mockService) },
      query: {},
      params: {},
      body: {},
      ...overrides,
    });

    it("should create a carrier and return 201", async () => {
      const mockService = createMockService();
      const carrier = { id: "carrier_new", name: "UPS" };
      mockService.createCarrierConfigs.mockResolvedValue(carrier);
      const req = createReq(mockService, {
        body: { name: "UPS", carrier_code: "ups" },
      });
      const res = createRes();

      await createCarrier(req, res);

      expect(mockService.createCarrierConfigs).toHaveBeenCalledWith({
        name: "UPS",
        carrier_code: "ups",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ carrier });
    });

    it("should return 400 on creation error", async () => {
      const mockService = createMockService();
      mockService.createCarrierConfigs.mockRejectedValue(
        new Error("Duplicate"),
      );
      const req = createReq(mockService, { body: {} });
      const res = createRes();

      await createCarrier(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
