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

describe("Subscription Billing Workflow – Integration", () => {
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

  describe("end-to-end billing cycle processing", () => {
    it("should load billing cycle and transition to processing state", async () => {
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
        attempt_count: 0,
        subscription: { id: "sub_01", customer_id: "cust_01" },
      };
      const container = mockContainer({
        subscription: {
          listBillingCycles: vi.fn().mockResolvedValue([[mockCycle]]),
          updateBillingCycles: vi
            .fn()
            .mockResolvedValue({
              ...mockCycle,
              status: "processing",
              attempt_count: 1,
            }),
        },
        query: {
          graph: vi
            .fn()
            .mockResolvedValueOnce({
              data: [{ id: "item_01", variant_id: "var_01", quantity: 1 }],
            })
            .mockResolvedValueOnce({
              data: [{ id: "cust_01", email: "customer@example.com" }],
            }),
        },
      });

      const loadResult = await loadBillingCycleStep(
        { billing_cycle_id: "cycle_01" },
        { container },
      );
      expect(loadResult.cycle.id).toBe("cycle_01");
      expect(loadResult.subscription.id).toBe("sub_01");

      const processResult = await markCycleProcessingStep(
        { cycle: mockCycle },
        { container },
      );
      expect(processResult.updatedCycle.status).toBe("processing");
      expect(processResult.updatedCycle.attempt_count).toBe(1);
    });

    it("should load subscription items and customer data", async () => {
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
      const graphFn = vi
        .fn()
        .mockResolvedValueOnce({
          data: [
            { id: "item_01", variant_id: "var_01", quantity: 2 },
            { id: "item_02", variant_id: "var_02", quantity: 1 },
          ],
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: "cust_02",
              email: "buyer@example.com",
              metadata: { stripe_id: "cus_abc" },
            },
          ],
        });

      const container = mockContainer({
        subscription: {
          listBillingCycles: vi.fn().mockResolvedValue([[mockCycle]]),
        },
        query: { graph: graphFn },
      });

      const result = await loadBillingCycleStep(
        { billing_cycle_id: "cycle_02" },
        { container },
      );
      expect(result.items).toHaveLength(2);
      expect(result.customer.email).toBe("buyer@example.com");
      expect(graphFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("step failure scenarios", () => {
    it("should reject billing cycle that is not found", async () => {
      const container = mockContainer({
        subscription: { listBillingCycles: vi.fn().mockResolvedValue([[]]) },
        query: { graph: vi.fn() },
      });

      await expect(
        loadBillingCycleStep(
          { billing_cycle_id: "nonexistent" },
          { container },
        ),
      ).rejects.toThrow("Billing cycle nonexistent not found");
    });

    it("should reject billing cycle not in upcoming status", async () => {
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
        status: "completed",
      };
      const container = mockContainer({
        subscription: {
          listBillingCycles: vi.fn().mockResolvedValue([[mockCycle]]),
        },
        query: { graph: vi.fn() },
      });

      await expect(
        loadBillingCycleStep({ billing_cycle_id: "cycle_03" }, { container }),
      ).rejects.toThrow("is not in upcoming status");
    });

    it("should reject billing cycle in processing status", async () => {
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
        id: "cycle_04",
        status: "processing",
      };
      const container = mockContainer({
        subscription: {
          listBillingCycles: vi.fn().mockResolvedValue([[mockCycle]]),
        },
        query: { graph: vi.fn() },
      });

      await expect(
        loadBillingCycleStep({ billing_cycle_id: "cycle_04" }, { container }),
      ).rejects.toThrow("is not in upcoming status");
    });
  });

  describe("compensation and state cleanup", () => {
    it("should provide compensation data for mark-cycle-processing step", async () => {
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
      expect(result.__compensation).toEqual({
        cycleId: "cycle_01",
        previousStatus: "upcoming",
        previousAttemptCount: 0,
      });
    });

    it("should increment attempt count correctly on retry", async () => {
      const updateBillingCycles = vi.fn().mockResolvedValue({});
      const container = mockContainer({
        subscription: { updateBillingCycles },
      });

      await markCycleProcessingStep(
        { cycle: { id: "cycle_01", status: "upcoming", attempt_count: 3 } },
        { container },
      );
      expect(updateBillingCycles).toHaveBeenCalledWith(
        expect.objectContaining({ attempt_count: 4 }),
      );
    });

    it("should have compensation function defined for mark-cycle-processing step", () => {
      expect(markCycleProcessingStep.compensate).toBeDefined();
    });

    it("should run mark-cycle-processing compensation idempotently", async () => {
      const updateBillingCycles = vi.fn().mockResolvedValue(undefined);
      const container = mockContainer({
        subscription: { updateBillingCycles },
      });

      const compensationData = {
        cycleId: "cycle_01",
        previousStatus: "upcoming",
        previousAttemptCount: 0,
      };

      await markCycleProcessingStep.compensate(compensationData, { container });
      expect(updateBillingCycles).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "cycle_01",
          status: "upcoming",
          attempt_count: 0,
        }),
      );

      await expect(
        markCycleProcessingStep.compensate(compensationData, { container }),
      ).resolves.not.toThrow();

      await expect(
        markCycleProcessingStep.compensate(null, { container }),
      ).resolves.not.toThrow();
    });

    it("should set last_attempt_at to a recent timestamp", async () => {
      const updateBillingCycles = vi.fn().mockResolvedValue({});
      const container = mockContainer({
        subscription: { updateBillingCycles },
      });
      const before = new Date();

      await markCycleProcessingStep(
        { cycle: { id: "cycle_01", status: "upcoming", attempt_count: 0 } },
        { container },
      );

      const calledWith = updateBillingCycles.mock.calls[0][0];
      expect(calledWith.last_attempt_at).toBeInstanceOf(Date);
      expect(calledWith.last_attempt_at.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });
});
