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

describe("Payment Reconciliation Workflow", () => {
  let fetchPaymentRecordsStep: any;
  let matchTransactionsStep: any;
  let reconcileStep: any;
  let generateReportStep: any;

  beforeAll(async () => {
    await import("../../../src/workflows/payment-reconciliation.js");
    const { createStep } = require("@medusajs/framework/workflows-sdk");
    const calls = createStep.mock.calls;
    fetchPaymentRecordsStep = calls.find(
      (c: any) => c[0] === "fetch-payment-records-step",
    )?.[1];
    matchTransactionsStep = calls.find(
      (c: any) => c[0] === "match-payment-transactions-step",
    )?.[1];
    reconcileStep = calls.find(
      (c: any) => c[0] === "reconcile-payments-step",
    )?.[1];
    generateReportStep = calls.find(
      (c: any) => c[0] === "generate-reconciliation-report-step",
    )?.[1];
  });

  const validInput = {
    tenantId: "tenant_01",
    dateFrom: "2026-01-01",
    dateTo: "2026-01-31",
    paymentProvider: "stripe",
  };

  describe("fetchPaymentRecordsStep", () => {
    it("should fetch payments within the date range", async () => {
      const mockPayments = [
        { id: "pay_01" },
        { id: "pay_02" },
        { id: "pay_03" },
      ];
      const container = mockContainer({
        payment: { listPayments: jest.fn().mockResolvedValue(mockPayments) },
      });
      const result = await fetchPaymentRecordsStep(validInput, { container });
      expect(result.payments).toEqual(mockPayments);
      expect(result.count).toBe(3);
    });

    it("should handle empty payment results", async () => {
      const container = mockContainer({
        payment: { listPayments: jest.fn().mockResolvedValue([]) },
      });
      const result = await fetchPaymentRecordsStep(validInput, { container });
      expect(result.payments).toEqual([]);
      expect(result.count).toBe(0);
    });

    it("should propagate payment module errors", async () => {
      const container = mockContainer({
        payment: {
          listPayments: jest
            .fn()
            .mockRejectedValue(new Error("Payment service down")),
        },
      });
      await expect(
        fetchPaymentRecordsStep(validInput, { container }),
      ).rejects.toThrow("Payment service down");
    });
  });

  describe("matchTransactionsStep", () => {
    it("should match all payments with confidence 1.0", async () => {
      const payments = [
        {
          id: "pay_01",
          amount: 100,
          reference_id: "order_01",
          created_at: new Date(),
        },
        {
          id: "pay_02",
          amount: 200,
          reference_id: "order_02",
          created_at: new Date(),
        },
      ];
      const orders = [
        { id: "order_01", total: 100, created_at: new Date() },
        { id: "order_02", total: 200, created_at: new Date() },
      ];
      const result = await matchTransactionsStep({ payments, orders });
      expect(result.matched).toHaveLength(2);
      expect(result.matched[0].payment_id).toBe("pay_01");
      expect(result.matched[0].matched).toBe(true);
    });

    it("should report zero unmatched when all match", async () => {
      const payments = [
        {
          id: "pay_01",
          amount: 100,
          reference_id: "order_01",
          created_at: new Date(),
        },
      ];
      const orders = [{ id: "order_01", total: 100, created_at: new Date() }];
      const result = await matchTransactionsStep({ payments, orders });
      expect(result.unmatchedCount).toBe(0);
    });

    it("should handle empty payments array", async () => {
      const result = await matchTransactionsStep({ payments: [], orders: [] });
      expect(result.matched).toEqual([]);
      expect(result.unmatchedCount).toBe(0);
    });
  });

  describe("reconcileStep", () => {
    it("should create a completed reconciliation record", async () => {
      const matched = [{ payment_id: "pay_01", matched: true }];
      const result = await reconcileStep({
        matched,
        unmatchedCount: 0,
        tenantId: "tenant_01",
      });
      expect(result.reconciliation.status).toBe("completed");
      expect(result.reconciliation.total_reconciled).toBe(1);
      expect(result.reconciliation.tenant_id).toBe("tenant_01");
    });
  });

  describe("generateReportStep", () => {
    it("should generate a report with period and totals", async () => {
      const reconciliation = {
        total_reconciled: 5,
        status: "completed",
        total_unmatched: 0,
      };
      const result = await generateReportStep({
        reconciliation,
        unmatched: [],
        dateFrom: "2026-01-01",
        dateTo: "2026-01-31",
      });
      expect(result.report.period).toEqual({
        from: "2026-01-01",
        to: "2026-01-31",
      });
      expect(result.report.total_reconciled).toBe(5);
      expect(result.report.status).toBe("completed");
      expect(result.report.generated_at).toBeInstanceOf(Date);
    });
  });
});
