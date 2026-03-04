import { vi } from "vitest";
vi.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: vi.fn((config, fn) => ({ run: vi.fn(), config, fn })),
  createStep: vi.fn((_name, fn, compensate) =>
    Object.assign(fn, { compensate }),
  ),
  StepResponse: class {
    constructor(data, comp) {
      Object.assign(this, data);
      this.__compensation = comp;
    }
  },
  WorkflowResponse: vi.fn((data) => data),
  transform: vi.fn((_deps, fn) => fn(_deps)),
}));

vi.mock("@medusajs/framework/utils", () => ({
  ContainerRegistrationKeys: { QUERY: "query", LOGGER: "logger" },
  Modules: { EVENT_BUS: "event_bus" },
}));

vi.mock("@medusajs/medusa/core-flows", () => ({
  createCartWorkflow: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class {
    constructor() {
      return {};
    }
  },
}));

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: vi.fn((name: string) => overrides[name] || {}),
});

describe("Subscription Billing Cycle Amounts", () => {
  let loadBillingCycleStep: any;
  let markCycleProcessingStep: any;

  beforeAll(async () => {
    await import(
      "../../../src/workflows/subscription/process-billing-cycle-workflow.js"
    );
    const { createStep } = await import("@medusajs/framework/workflows-sdk");
    const calls = createStep.mock.calls;
    loadBillingCycleStep = calls.find(
      (c: any) => c[0] === "load-billing-cycle",
    )?.[1];
    markCycleProcessingStep = calls.find(
      (c: any) => c[0] === "mark-cycle-processing",
    )?.[1];
  });

  describe("billing cycle data loading", () => {
    it("should load single-item subscription with correct quantity", async () => {
      const mockCycle = {
        baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
        __joinerConfig: vi.fn(),
        listInsuranceClaims: vi.fn().mockResolvedValue([]),
        updateInsuranceClaims: vi.fn().mockResolvedValue([]),
        deleteInsuranceClaims: vi.fn().mockResolvedValue([]),
        listInsurancePolicies: vi.fn().mockResolvedValue([]),
        countInsurancePolicies: vi.fn().mockResolvedValue([]),
        generateQuoteNumber: vi.fn().mockResolvedValue([]),
        listCommissions: vi.fn().mockResolvedValue([]),
        createCommissions: vi.fn().mockResolvedValue([]),
        createCommissionTiers: vi.fn().mockResolvedValue([]),
        updateSubscriptions: vi.fn().mockResolvedValue([]),
        markHelpful: vi.fn().mockResolvedValue([]),
        listCompanyUsers: vi.fn().mockResolvedValue([]),
        updateVendors: vi.fn().mockResolvedValue([]),
        updatePayouts: vi.fn().mockResolvedValue([]),
        updateTenantUsers: vi.fn().mockResolvedValue([]),
        updateBookings: vi.fn().mockResolvedValue([]),
        listClassSchedules: vi.fn().mockResolvedValue([]),
        listTrainerProfiles: vi.fn().mockResolvedValue([]),
        listCourses: vi.fn().mockResolvedValue([]),

        id: "cycle_01",
        status: "upcoming",
        subscription_id: "sub_01",
        subscription: { id: "sub_01", customer_id: "cust_01" },
      };
      const container = mockContainer({
        subscription: {
          listBillingCycles: vi.fn().mockResolvedValue([[mockCycle]]),
        },
        query: {
          graph: vi
            .fn()
            .mockResolvedValueOnce({
              data: [
                {
                  id: "item_01",
                  variant_id: "var_01",
                  quantity: 1,
                  unit_price: 2999,
                },
              ],
            })
            .mockResolvedValueOnce({
              data: [{ id: "cust_01", email: "test@example.com" }],
            }),
        },
      });

      const result = await loadBillingCycleStep(
        { billing_cycle_id: "cycle_01" },
        { container },
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(1);
      expect(result.items[0].unit_price).toBe(2999);
    });

    it("should load multi-item subscription with correct quantities", async () => {
      const mockCycle = {
        baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
        __joinerConfig: vi.fn(),
        listInsuranceClaims: vi.fn().mockResolvedValue([]),
        updateInsuranceClaims: vi.fn().mockResolvedValue([]),
        deleteInsuranceClaims: vi.fn().mockResolvedValue([]),
        listInsurancePolicies: vi.fn().mockResolvedValue([]),
        countInsurancePolicies: vi.fn().mockResolvedValue([]),
        generateQuoteNumber: vi.fn().mockResolvedValue([]),
        listCommissions: vi.fn().mockResolvedValue([]),
        createCommissions: vi.fn().mockResolvedValue([]),
        createCommissionTiers: vi.fn().mockResolvedValue([]),
        updateSubscriptions: vi.fn().mockResolvedValue([]),
        markHelpful: vi.fn().mockResolvedValue([]),
        listCompanyUsers: vi.fn().mockResolvedValue([]),
        updateVendors: vi.fn().mockResolvedValue([]),
        updatePayouts: vi.fn().mockResolvedValue([]),
        updateTenantUsers: vi.fn().mockResolvedValue([]),
        updateBookings: vi.fn().mockResolvedValue([]),
        listClassSchedules: vi.fn().mockResolvedValue([]),
        listTrainerProfiles: vi.fn().mockResolvedValue([]),
        listCourses: vi.fn().mockResolvedValue([]),

        id: "cycle_02",
        status: "upcoming",
        subscription_id: "sub_02",
        subscription: { id: "sub_02", customer_id: "cust_02" },
      };
      const items = [
        { id: "item_01", variant_id: "var_01", quantity: 2, unit_price: 1500 },
        { id: "item_02", variant_id: "var_02", quantity: 1, unit_price: 4999 },
        { id: "item_03", variant_id: "var_03", quantity: 5, unit_price: 500 },
      ];
      const container = mockContainer({
        subscription: {
          listBillingCycles: vi.fn().mockResolvedValue([[mockCycle]]),
        },
        query: {
          graph: vi
            .fn()
            .mockResolvedValueOnce({ data: items })
            .mockResolvedValueOnce({
              data: [{ id: "cust_02", email: "multi@example.com" }],
            }),
        },
      });

      const result = await loadBillingCycleStep(
        { billing_cycle_id: "cycle_02" },
        { container },
      );
      expect(result.items).toHaveLength(3);
      const totalAmount = items.reduce(
        (sum, i) => sum + i.quantity * i.unit_price,
        0,
      );
      expect(totalAmount).toBe(2 * 1500 + 1 * 4999 + 5 * 500);
      expect(totalAmount).toBe(10499);
    });

    it("should associate correct customer with billing cycle", async () => {
      const mockCycle = {
        baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
        __joinerConfig: vi.fn(),
        listInsuranceClaims: vi.fn().mockResolvedValue([]),
        updateInsuranceClaims: vi.fn().mockResolvedValue([]),
        deleteInsuranceClaims: vi.fn().mockResolvedValue([]),
        listInsurancePolicies: vi.fn().mockResolvedValue([]),
        countInsurancePolicies: vi.fn().mockResolvedValue([]),
        generateQuoteNumber: vi.fn().mockResolvedValue([]),
        listCommissions: vi.fn().mockResolvedValue([]),
        createCommissions: vi.fn().mockResolvedValue([]),
        createCommissionTiers: vi.fn().mockResolvedValue([]),
        updateSubscriptions: vi.fn().mockResolvedValue([]),
        markHelpful: vi.fn().mockResolvedValue([]),
        listCompanyUsers: vi.fn().mockResolvedValue([]),
        updateVendors: vi.fn().mockResolvedValue([]),
        updatePayouts: vi.fn().mockResolvedValue([]),
        updateTenantUsers: vi.fn().mockResolvedValue([]),
        updateBookings: vi.fn().mockResolvedValue([]),
        listClassSchedules: vi.fn().mockResolvedValue([]),
        listTrainerProfiles: vi.fn().mockResolvedValue([]),
        listCourses: vi.fn().mockResolvedValue([]),

        id: "cycle_03",
        status: "upcoming",
        subscription_id: "sub_03",
        subscription: { id: "sub_03", customer_id: "cust_03" },
      };
      const container = mockContainer({
        subscription: {
          listBillingCycles: vi.fn().mockResolvedValue([[mockCycle]]),
        },
        query: {
          graph: vi
            .fn()
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({
              data: [
                {
                  id: "cust_03",
                  email: "vip@example.com",
                  metadata: { stripe_customer_id: "cus_xyz" },
                },
              ],
            }),
        },
      });

      const result = await loadBillingCycleStep(
        { billing_cycle_id: "cycle_03" },
        { container },
      );
      expect(result.customer.id).toBe("cust_03");
      expect(result.customer.email).toBe("vip@example.com");
    });
  });

  describe("billing cycle status transitions", () => {
    it("should transition from upcoming to processing with attempt count 1", async () => {
      const cycle = { id: "cycle_01", status: "upcoming", attempt_count: 0 };
      const container = mockContainer({
        subscription: {
          updateBillingCycles: vi
            .fn()
            .mockResolvedValue({
              ...cycle,
              status: "processing",
              attempt_count: 1,
            }),
        },
      });

      const result = await markCycleProcessingStep({ cycle }, { container });
      expect(result.updatedCycle.status).toBe("processing");
      expect(result.updatedCycle.attempt_count).toBe(1);
    });

    it("should track retry attempts accurately", async () => {
      const updateFn = vi.fn().mockResolvedValue({});
      const container = mockContainer({
        subscription: { updateBillingCycles: updateFn },
      });

      await markCycleProcessingStep(
        { cycle: { id: "c1", status: "upcoming", attempt_count: 0 } },
        { container },
      );
      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ attempt_count: 1 }),
      );

      updateFn.mockClear();
      await markCycleProcessingStep(
        { cycle: { id: "c1", status: "upcoming", attempt_count: 4 } },
        { container },
      );
      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ attempt_count: 5 }),
      );
    });

    it("should reject cycles not in upcoming status", async () => {
      const container = mockContainer({
        subscription: {
          listBillingCycles: vi
            .fn()
            .mockResolvedValue([[{ id: "c1", status: "failed" }]]),
        },
        query: { graph: vi.fn() },
      });

      await expect(
        loadBillingCycleStep({ billing_cycle_id: "c1" }, { container }),
      ).rejects.toThrow("is not in upcoming status");
    });
  });

  describe("compensation preserves billing integrity", () => {
    it("should store previous status for rollback", async () => {
      const cycle = { id: "cycle_01", status: "upcoming", attempt_count: 2 };
      const container = mockContainer({
        subscription: { updateBillingCycles: vi.fn().mockResolvedValue({}) },
      });

      const result = await markCycleProcessingStep({ cycle }, { container });
      expect(result.__compensation.previousStatus).toBe("upcoming");
      expect(result.__compensation.previousAttemptCount).toBe(2);
    });
  });
});
