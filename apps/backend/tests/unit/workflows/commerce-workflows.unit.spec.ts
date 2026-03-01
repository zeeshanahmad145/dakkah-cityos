jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn((config, fn) => {
    return { run: jest.fn(), config, fn };
  }),
  createStep: jest.fn((_name, fn) => fn),
  StepResponse: jest.fn((data) => data),
  WorkflowResponse: jest.fn((data) => data),
}));

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
});

describe("Order Fulfillment Workflow", () => {
  let validateOrderStep: any;
  let allocateInventoryStep: any;
  let createShipmentStep: any;

  beforeAll(async () => {
    const mod = await import("../../../src/workflows/order-fulfillment.js");
    const { createStep } = require("@medusajs/framework/workflows-sdk");
    const calls = createStep.mock.calls;
    validateOrderStep = calls.find(
      (c: any) => c[0] === "validate-order-step",
    )?.[1];
    allocateInventoryStep = calls.find(
      (c: any) => c[0] === "allocate-inventory-step",
    )?.[1];
    createShipmentStep = calls.find(
      (c: any) => c[0] === "create-shipment-step",
    )?.[1];
  });

  const validInput = {
    orderId: "order_1",
    items: [{ lineItemId: "li_1", quantity: 2 }],
    shippingMethod: "standard",
    warehouseId: "wh_1",
  };

  it("should validate an existing order", async () => {
    const container = mockContainer({
      order: { retrieveOrder: jest.fn().mockResolvedValue({ id: "order_1" }) },
    });
    const result = await validateOrderStep(validInput, { container });
    expect(result).toEqual({ order: { id: "order_1" } });
  });

  it("should throw if order not found", async () => {
    const container = mockContainer({
      order: { retrieveOrder: jest.fn().mockResolvedValue(null) },
    });
    await expect(validateOrderStep(validInput, { container })).rejects.toThrow(
      "Order order_1 not found",
    );
  });

  it("should allocate inventory for items", async () => {
    const allocs = [{ id: "alloc_1" }];
    const container = mockContainer({
      inventory: {
        createReservationItems: jest.fn().mockResolvedValue(allocs),
      },
    });
    const result = await allocateInventoryStep(validInput, { container });
    expect(result).toEqual({ allocations: allocs });
  });

  it("should create a shipment", async () => {
    const shipment = { id: "ship_1" };
    const container = mockContainer({
      fulfillment: { createFulfillment: jest.fn().mockResolvedValue(shipment) },
    });
    const result = await createShipmentStep(validInput, { container });
    expect(result).toEqual({ shipment });
  });
});

describe("Commission Calculation Workflow", () => {
  let calculateCommissionStep: any;
  let deductCommissionStep: any;
  let recordPayoutStep: any;

  beforeAll(async () => {
    const mod = await import(
      "../../../src/workflows/commission-calculation.js"
    );
    const { createStep } = require("@medusajs/framework/workflows-sdk");
    const calls = createStep.mock.calls;
    calculateCommissionStep = calls.find(
      (c: any) => c[0] === "calculate-vendor-commission-step",
    )?.[1];
    deductCommissionStep = calls.find(
      (c: any) => c[0] === "deduct-commission-step",
    )?.[1];
    recordPayoutStep = calls.find(
      (c: any) => c[0] === "record-commission-payout-step",
    )?.[1];
  });

  const validInput = {
    vendorId: "vendor_1",
    orderId: "order_1",
    orderTotal: 1000,
    orderSubtotal: 800,
    tenantId: "tenant_1",
    lineItems: [{ id: "li_1", amount: 800 }],
  };

  it("should calculate commission with custom rate", async () => {
    const container = mockContainer({
      commission: {
        listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0.15 }]),
      },
    });
    const result = await calculateCommissionStep(validInput, { container });
    expect(result.commissionAmount).toBe(120);
    expect(result.rate).toBe(0.15);
    expect(result.netAmount).toBe(680);
  });

  it("should use default rate 0.1 when no rules", async () => {
    const container = mockContainer({
      commission: { listCommissionRules: jest.fn().mockResolvedValue([]) },
    });
    const result = await calculateCommissionStep(validInput, { container });
    expect(result.rate).toBe(0.1);
    expect(result.commissionAmount).toBe(80);
  });

  it("should deduct commission and create transaction", async () => {
    const tx = { id: "tx_1" };
    const container = mockContainer({
      commission: {
        createCommissionTransaction: jest.fn().mockResolvedValue(tx),
      },
    });
    const result = await deductCommissionStep(
      { vendorId: "v1", commissionAmount: 100, orderId: "o1" },
      { container },
    );
    expect(result).toEqual({ transaction: tx });
  });

  it("should record payout for vendor", async () => {
    const payout = { id: "payout_1" };
    const container = mockContainer({
      payout: { createPayouts: jest.fn().mockResolvedValue(payout) },
    });
    const result = await recordPayoutStep(
      { vendorId: "v1", netAmount: 700, orderId: "o1" },
      { container },
    );
    expect(result).toEqual({ payout });
  });
});

describe("Payment Reconciliation Workflow", () => {
  let fetchPaymentRecordsStep: any;
  let matchTransactionsStep: any;
  let reconcileStep: any;
  let generateReportStep: any;

  beforeAll(async () => {
    const mod = await import(
      "../../../src/workflows/payment-reconciliation.js"
    );
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

  it("should fetch payment records", async () => {
    const payments = [{ id: "p1" }, { id: "p2" }];
    const container = mockContainer({
      payment: { listPayments: jest.fn().mockResolvedValue(payments) },
    });
    const result = await fetchPaymentRecordsStep(
      {
        tenantId: "t1",
        dateFrom: "2025-01-01",
        dateTo: "2025-01-31",
        paymentProvider: "stripe",
      },
      { container },
    );
    expect(result.count).toBe(2);
  });

  it("should match all transactions", async () => {
    const payments = [
      { id: "p1", amount: 100, reference_id: "o1", created_at: new Date() },
      { id: "p2", amount: 200, reference_id: "o2", created_at: new Date() },
    ];
    const orders = [
      { id: "o1", total: 100, created_at: new Date() },
      { id: "o2", total: 200, created_at: new Date() },
    ];
    const result = await matchTransactionsStep(
      { payments, orders },
      { container: mockContainer() },
    );
    expect(result.matched).toHaveLength(2);
    expect(result.unmatchedCount).toBe(0);
  });

  it("should reconcile matched payments", async () => {
    const result = await reconcileStep(
      {
        matched: [{ id: "m1", confidence: 1.0 }],
        unmatchedCount: 0,
        tenantId: "t1",
      },
      { container: mockContainer() },
    );
    expect(result.reconciliation.status).toBe("completed");
    expect(result.reconciliation.total_reconciled).toBe(1);
  });

  it("should generate reconciliation report", async () => {
    const reconciliation = {
      total_reconciled: 5,
      status: "completed",
      total_unmatched: 0,
    };
    const result = await generateReportStep(
      {
        reconciliation,
        unmatched: [],
        dateFrom: "2025-01-01",
        dateTo: "2025-01-31",
      },
      { container: mockContainer() },
    );
    expect(result.report.period.from).toBe("2025-01-01");
    expect(result.report.total_reconciled).toBe(5);
  });
});

describe("Return Processing Workflow", () => {
  let requestReturnStep: any;
  let inspectReturnStep: any;
  let processRefundStep: any;
  let restockItemsStep: any;

  beforeAll(async () => {
    const mod = await import("../../../src/workflows/return-processing.js");
    const { createStep } = require("@medusajs/framework/workflows-sdk");
    const calls = createStep.mock.calls;
    requestReturnStep = calls.find(
      (c: any) => c[0] === "request-return-step",
    )?.[1];
    inspectReturnStep = calls.find(
      (c: any) => c[0] === "inspect-return-items-step",
    )?.[1];
    processRefundStep = calls.find(
      (c: any) => c[0] === "process-return-refund-step",
    )?.[1];
    restockItemsStep = calls.find(
      (c: any) => c[0] === "restock-returned-items-step",
    )?.[1];
  });

  const validInput = {
    orderId: "order_1",
    customerId: "cust_1",
    items: [{ lineItemId: "li_1", quantity: 1, reason: "defective" }],
    returnMethod: "mail",
  };

  it("should create a return request", async () => {
    const container = mockContainer();
    const result = await requestReturnStep(validInput, { container });
    expect(result.returnRequest.status).toBe("requested");
    expect(result.returnRequest.order_id).toBe("order_1");
  });

  it("should inspect returned items", async () => {
    const result = await inspectReturnStep(
      { returnRequest: { id: "ret_1" } },
      { container: mockContainer() },
    );
    expect(result.inspection.items_received).toBe(true);
    expect(result.inspection.condition).toBe("acceptable");
  });

  it("should process refund", async () => {
    const container = mockContainer();
    const result = await processRefundStep(
      { orderId: "order_1", items: [], customerId: "cust_1" },
      { container },
    );
    expect(result.refund.status).toBe("refunded");
  });

  it("should restock items", async () => {
    const container = mockContainer();
    const items = [{ lineItemId: "li_1", quantity: 2 }];
    const result = await restockItemsStep({ items }, { container });
    expect(result.restocked).toHaveLength(1);
    expect(result.restocked[0].restocked).toBe(true);
  });
});
