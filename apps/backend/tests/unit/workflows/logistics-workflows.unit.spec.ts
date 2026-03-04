import { vi } from "vitest";
vi.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: vi.fn((config, fn) => {
    return { run: vi.fn(), config, fn };
  }),
  createStep: vi.fn((_name, fn) => fn),
  StepResponse: class { constructor(data) { Object.assign(this, data); } },
  WorkflowResponse: vi.fn((data) => data),
}));

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: vi.fn((name: string) => overrides[name] || {}),
});

describe("Fleet Dispatch Workflow", () => {
  let prepareOrderForDispatchStep: any;
  let findAvailableDriverStep: any;
  let assignDriverStep: any;
  let initializeTrackingStep: any;

  beforeAll(async () => {
    await import("../../../src/workflows/fleet-dispatch.js");
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"));
    const calls = createStep.mock.calls;
    prepareOrderForDispatchStep = calls.find(
      (c: any) => c[0] === "prepare-order-dispatch-step",
    )?.[1];
    findAvailableDriverStep = calls.find(
      (c: any) => c[0] === "find-available-driver-step",
    )?.[1];
    assignDriverStep = calls.find(
      (c: any) => c[0] === "assign-driver-step",
    )?.[1];
    initializeTrackingStep = calls.find(
      (c: any) => c[0] === "initialize-delivery-tracking-step",
    )?.[1];
  });

  it("should prepare order for dispatch", async () => {
    const result = await prepareOrderForDispatchStep({
      orderId: "o1",
      pickupAddress: "123 Main St",
      deliveryAddress: "456 Elm St",
      packageWeight: 5,
      priority: "express",
      tenantId: "t1",
    });
    expect(result.dispatchRequest.status).toBe("pending_assignment");
    expect(result.dispatchRequest.priority).toBe("express");
  });

  it("should find an available driver", async () => {
    const container = mockContainer({
      fleetbaseService: {
        getAvailableDrivers: jest
          .fn()
          .mockResolvedValue([{ id: "d1", distance_km: 2.5 }]),
      },
    });
    const result = await findAvailableDriverStep(
      { pickupAddress: "123 Main St", priority: "express" },
      { container },
    );
    expect(result.driver.driver_id).toBeDefined();
    expect(result.driver.distance_km).toBe(2.5);
  });

  it("should assign driver to order", async () => {
    const container = mockContainer({
      fleetbaseService: { assignDriver: vi.fn().mockResolvedValue({}) },
    });
    const result = await assignDriverStep(
      { orderId: "o1", driverId: "d1" },
      { container },
    );
    expect(result.assignment.status).toBe("assigned");
    expect(result.assignment.order_id).toBe("o1");
  });

  it("should initialize delivery tracking", async () => {
    const result = await initializeTrackingStep(
      { orderId: "o1", driverId: "d1" },
      { container: mockContainer() },
    );
    expect(result.tracking.status).toBe("in_transit");
    expect(result.tracking.tracking_id).toContain("TRK-o1");
  });
});

describe("Inventory Replenishment Workflow", () => {
  let checkStockAlertStep: any;
  let calculateOrderQuantityStep: any;
  let createPurchaseOrderStep: any;

  beforeAll(async () => {
    await import("../../../src/workflows/inventory-replenishment.js");
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"));
    const calls = createStep.mock.calls;
    checkStockAlertStep = calls.find(
      (c: any) => c[0] === "check-stock-alert-step",
    )?.[1];
    calculateOrderQuantityStep = calls.find(
      (c: any) => c[0] === "calculate-reorder-quantity-step",
    )?.[1];
    createPurchaseOrderStep = calls.find(
      (c: any) => c[0] === "create-purchase-order-step",
    )?.[1];
  });

  it("should trigger alert when stock below reorder point", async () => {
    const result = await checkStockAlertStep(
      {
        productId: "p1",
        variantId: "v1",
        locationId: "l1",
        currentStock: 5,
        reorderPoint: 10,
        reorderQuantity: 50,
      },
      { container: mockContainer() },
    );
    expect(result.needsReorder).toBe(true);
    expect(result.deficit).toBe(5);
  });

  it("should throw when stock above reorder point", async () => {
    await expect(
      checkStockAlertStep(
        {
          productId: "p1",
          variantId: "v1",
          locationId: "l1",
          currentStock: 15,
          reorderPoint: 10,
          reorderQuantity: 50,
        },
        { container: mockContainer() },
      ),
    ).rejects.toThrow("Stock level is above reorder point");
  });

  it("should calculate reorder quantity", async () => {
    const result = await calculateOrderQuantityStep(
      {
        productId: "p1",
        variantId: "v1",
        locationId: "l1",
        currentStock: 3,
        reorderPoint: 10,
        reorderQuantity: 50,
      },
      { container: mockContainer() },
    );
    expect(result.quantity).toBe(50);
  });

  it("should calculate larger quantity when deficit exceeds reorder quantity", async () => {
    const result = await calculateOrderQuantityStep(
      {
        productId: "p1",
        variantId: "v1",
        locationId: "l1",
        currentStock: 0,
        reorderPoint: 100,
        reorderQuantity: 50,
      },
      { container: mockContainer() },
    );
    expect(result.quantity).toBe(100);
  });

  it("should create a purchase order", async () => {
    const container = mockContainer();
    const result = await createPurchaseOrderStep(
      { variantId: "v1", quantity: 50, locationId: "l1", supplierId: "s1" },
      { container },
    );
    expect(result.purchaseOrder.status).toBe("pending");
    expect(result.purchaseOrder.quantity).toBe(50);
  });
});

describe("Dispute Resolution Workflow", () => {
  let openDisputeStep: any;
  let reviewDisputeStep: any;
  let resolveDisputeStep: any;

  beforeAll(async () => {
    await import("../../../src/workflows/dispute-resolution.js");
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"));
    const calls = createStep.mock.calls;
    openDisputeStep = calls.find((c: any) => c[0] === "open-dispute-step")?.[1];
    reviewDisputeStep = calls.find(
      (c: any) => c[0] === "review-dispute-step",
    )?.[1];
    resolveDisputeStep = calls.find(
      (c: any) => c[0] === "resolve-dispute-step",
    )?.[1];
  });

  it("should open a dispute", async () => {
    const dispute = { id: "d_1", status: "open" };
    const container = mockContainer({
      dispute: { createDisputes: vi.fn().mockResolvedValue(dispute) },
    });
    const result = await openDisputeStep(
      {
        orderId: "o1",
        customerId: "c1",
        vendorId: "v1",
        reason: "defective",
        description: "Item broken",
      },
      { container },
    );
    expect(result.dispute.status).toBe("open");
  });

  it("should review a dispute", async () => {
    const updated = { id: "d_1", status: "under_review" };
    const container = mockContainer({
      dispute: { updateDisputes: vi.fn().mockResolvedValue(updated) },
    });
    const result = await reviewDisputeStep({ disputeId: "d_1" }, { container });
    expect(result.dispute.status).toBe("under_review");
  });

  it("should resolve a dispute", async () => {
    const resolved = { id: "d_1", status: "resolved", resolution: "refund" };
    const container = mockContainer({
      dispute: { updateDisputes: vi.fn().mockResolvedValue(resolved) },
    });
    const result = await resolveDisputeStep(
      { disputeId: "d_1", resolution: "refund" },
      { container },
    );
    expect(result.dispute.status).toBe("resolved");
  });
});
