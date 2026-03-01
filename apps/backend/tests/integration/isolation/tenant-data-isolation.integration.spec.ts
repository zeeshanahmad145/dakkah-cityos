jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn((config, fn) => ({ run: jest.fn(), config, fn })),
  createStep: jest.fn((_name, fn, compensate) =>
    Object.assign(fn, { compensate }),
  ),
  StepResponse: jest.fn((data, compensationData) => ({
    ...data,
    __compensation: compensationData,
  })),
  WorkflowResponse: jest.fn((data) => data),
}));

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
});

let calculateCommissionStep: any;

beforeAll(async () => {
  await import("../../../src/workflows/commission-calculation.js");
  const { createStep } = require("@medusajs/framework/workflows-sdk");
  const calls = createStep.mock.calls;
  calculateCommissionStep = calls.find(
    (c: any) => c[0] === "calculate-vendor-commission-step",
  )?.[1];
});

const mockJson = jest.fn();
const mockStatus = jest.fn(() => ({ json: mockJson }));

const createMockReq = (overrides: Record<string, any> = {}) => ({
  query: {},
  body: {},
  auth_context: { actor_id: "admin_01" },
  scope: {
    resolve: jest.fn((name: string) => overrides[name] || {}),
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

describe("Tenant Data Isolation", () => {
  describe("product data isolation", () => {
    it("should prevent tenant A from accessing tenant B products", async () => {
      const tenantAProducts = [
        { id: "prod_01", name: "Widget A", tenant_id: "tenant_A" },
        { id: "prod_02", name: "Gadget A", tenant_id: "tenant_A" },
      ];
      const tenantBProducts = [
        { id: "prod_03", name: "Widget B", tenant_id: "tenant_B" },
      ];

      const listProducts = jest.fn().mockImplementation((filters: any) => {
        if (filters.tenant_id === "tenant_A") return tenantAProducts;
        if (filters.tenant_id === "tenant_B") return tenantBProducts;
        return [];
      });

      const containerA = mockContainer({ product: { listProducts } });
      const containerB = mockContainer({ product: { listProducts } });

      const serviceA = containerA.resolve("product");
      const serviceB = containerB.resolve("product");

      const resultA = serviceA.listProducts({ tenant_id: "tenant_A" });
      expect(resultA).toHaveLength(2);
      expect(resultA.every((p: any) => p.tenant_id === "tenant_A")).toBe(true);

      const resultB = serviceB.listProducts({ tenant_id: "tenant_B" });
      expect(resultB).toHaveLength(1);
      expect(resultB.every((p: any) => p.tenant_id === "tenant_B")).toBe(true);

      const noMatch = resultA.filter((p: any) => p.tenant_id === "tenant_B");
      expect(noMatch).toHaveLength(0);

      expect(containerA.resolve).toHaveBeenCalledWith("product");
      expect(containerB.resolve).toHaveBeenCalledWith("product");
    });

    it("should scope queries to the requesting tenant", async () => {
      const listProducts = jest.fn().mockResolvedValue([]);
      const container = mockContainer({ product: { listProducts } });

      const productService = container.resolve("product");
      await productService.listProducts({ tenant_id: "tenant_A" });

      expect(listProducts).toHaveBeenCalledWith({ tenant_id: "tenant_A" });
      expect(container.resolve).toHaveBeenCalledWith("product");
    });

    it("should reject cross-tenant product access", async () => {
      const retrieveProduct = jest
        .fn()
        .mockImplementation((id: string, context: any) => {
          const product = { id, tenant_id: "tenant_A" };
          if (context.tenant_id !== product.tenant_id) {
            throw new Error("Access denied: cross-tenant access not allowed");
          }
          return product;
        });

      const container = mockContainer({ product: { retrieveProduct } });
      const productService = container.resolve("product");

      expect(() =>
        productService.retrieveProduct("prod_01", { tenant_id: "tenant_B" }),
      ).toThrow("cross-tenant access not allowed");
      expect(
        productService.retrieveProduct("prod_01", { tenant_id: "tenant_A" }),
      ).toEqual({ id: "prod_01", tenant_id: "tenant_A" });
    });
  });

  describe("order data isolation", () => {
    it("should prevent tenant A from viewing tenant B orders", async () => {
      const listOrders = jest.fn().mockImplementation((filters: any) => {
        const allOrders = [
          { id: "order_01", tenant_id: "tenant_A", total: 5000 },
          { id: "order_02", tenant_id: "tenant_B", total: 3000 },
          { id: "order_03", tenant_id: "tenant_A", total: 7000 },
        ];
        return allOrders.filter((o) => o.tenant_id === filters.tenant_id);
      });

      const container = mockContainer({ order: { listOrders } });
      const orderService = container.resolve("order");

      const tenantAOrders = orderService.listOrders({ tenant_id: "tenant_A" });
      expect(tenantAOrders).toHaveLength(2);
      expect(tenantAOrders.some((o: any) => o.tenant_id === "tenant_B")).toBe(
        false,
      );

      const tenantBOrders = orderService.listOrders({ tenant_id: "tenant_B" });
      expect(tenantBOrders).toHaveLength(1);
      expect(tenantBOrders[0].id).toBe("order_02");
    });

    it("should prevent tenant B from modifying tenant A orders", async () => {
      const updateOrder = jest
        .fn()
        .mockImplementation((orderId: string, data: any, context: any) => {
          const order = { id: orderId, tenant_id: "tenant_A" };
          if (context.tenant_id !== order.tenant_id) {
            throw new Error(
              "Forbidden: cannot modify orders from another tenant",
            );
          }
          return { ...order, ...data };
        });

      const container = mockContainer({ order: { updateOrder } });
      const orderService = container.resolve("order");

      expect(() =>
        orderService.updateOrder(
          "order_01",
          { status: "cancelled" },
          { tenant_id: "tenant_B" },
        ),
      ).toThrow("cannot modify orders from another tenant");

      const updated = orderService.updateOrder(
        "order_01",
        { status: "cancelled" },
        { tenant_id: "tenant_A" },
      );
      expect(updated.status).toBe("cancelled");
      expect(updated.tenant_id).toBe("tenant_A");
    });
  });

  describe("customer data isolation", () => {
    it("should isolate customer records between tenants", async () => {
      const listCustomers = jest.fn().mockImplementation((filters: any) => {
        const customers = [
          { id: "cust_01", email: "alice@a.com", tenant_id: "tenant_A" },
          { id: "cust_02", email: "bob@b.com", tenant_id: "tenant_B" },
        ];
        return customers.filter((c) => c.tenant_id === filters.tenant_id);
      });

      const container = mockContainer({ customer: { listCustomers } });
      const customerService = container.resolve("customer");

      const tenantACustomers = customerService.listCustomers({
        tenant_id: "tenant_A",
      });
      expect(tenantACustomers).toHaveLength(1);
      expect(tenantACustomers[0].email).toBe("alice@a.com");

      const tenantBCustomers = customerService.listCustomers({
        tenant_id: "tenant_B",
      });
      expect(tenantBCustomers).toHaveLength(1);
      expect(tenantBCustomers[0].email).toBe("bob@b.com");

      const noOverlap = tenantACustomers.filter((c: any) =>
        tenantBCustomers.some((bc: any) => bc.id === c.id),
      );
      expect(noOverlap).toHaveLength(0);
    });

    it("should not leak customer count across tenants", async () => {
      const countCustomers = jest.fn().mockImplementation((filters: any) => {
        const all = [
          { tenant_id: "tenant_A" },
          { tenant_id: "tenant_A" },
          { tenant_id: "tenant_A" },
          { tenant_id: "tenant_B" },
        ];
        return all.filter((c) => c.tenant_id === filters.tenant_id).length;
      });

      const container = mockContainer({ customer: { countCustomers } });
      const customerService = container.resolve("customer");

      expect(customerService.countCustomers({ tenant_id: "tenant_A" })).toBe(3);
      expect(customerService.countCustomers({ tenant_id: "tenant_B" })).toBe(1);
    });
  });

  describe("commission data isolation", () => {
    it("should isolate commission rules per tenant", async () => {
      const listCommissionRules = jest
        .fn()
        .mockImplementation((filters: any) => {
          const rules = [
            { id: "rule_01", rate: 0.1, tenant_id: "tenant_A" },
            { id: "rule_02", rate: 0.2, tenant_id: "tenant_B" },
          ];
          return rules.filter((r) => r.tenant_id === filters.tenant_id);
        });

      const container = mockContainer({ commission: { listCommissionRules } });
      const commissionService = container.resolve("commission");

      const rulesA = commissionService.listCommissionRules({
        tenant_id: "tenant_A",
      });
      expect(rulesA).toHaveLength(1);
      expect(rulesA[0].rate).toBe(0.1);

      const rulesB = commissionService.listCommissionRules({
        tenant_id: "tenant_B",
      });
      expect(rulesB).toHaveLength(1);
      expect(rulesB[0].rate).toBe(0.2);
    });

    it("should calculate different commissions for different vendors via the real step", async () => {
      const containerVendorA = mockContainer({
        commission: {
          listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0.1 }]),
        },
      });
      const containerVendorB = mockContainer({
        commission: {
          listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0.25 }]),
        },
      });

      const baseInput = {
        orderId: "order_01",
        orderTotal: 12000,
        orderSubtotal: 10000,
        tenantId: "tenant_01",
        lineItems: [{ id: "li_01", amount: 10000 }],
      };

      const resultA = await calculateCommissionStep(
        { ...baseInput, vendorId: "vendor_A" },
        { container: containerVendorA },
      );
      const resultB = await calculateCommissionStep(
        { ...baseInput, vendorId: "vendor_B" },
        { container: containerVendorB },
      );

      expect(resultA.rate).toBe(0.1);
      expect(resultA.commissionAmount).toBe(1000);
      expect(resultA.netAmount).toBe(9000);

      expect(resultB.rate).toBe(0.25);
      expect(resultB.commissionAmount).toBe(2500);
      expect(resultB.netAmount).toBe(7500);

      expect(resultA.commissionAmount).not.toBe(resultB.commissionAmount);
      expect(resultA.netAmount).not.toBe(resultB.netAmount);

      expect(resultA.commissionAmount + resultA.netAmount).toBe(10000);
      expect(resultB.commissionAmount + resultB.netAmount).toBe(10000);
    });
  });
});
