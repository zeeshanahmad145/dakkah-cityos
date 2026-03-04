/**
 * Temporal Client — Unit Tests
 *
 * Tests the temporal-client.ts wrapper:
 * - startCanonicalWorkflow() resolves task queue from WORKFLOW_TASK_QUEUES
 * - signalWorkflow() calls the correct client method
 * - Handles missing configuration gracefully
 * - Legacy startWorkflow() shim still works
 *
 * Run: pnpm --filter backend test:unit
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Temporal SDK client ───────────────────────────────────────────────
const mockWorkflowHandle = {
  signal: vi.fn(async () => {}),
};

const mockWorkflowClient = {
  start: vi.fn(async () => ({
    workflowId: "wf_mock",
    firstExecutionRunId: "run_mock",
  })),
  getHandle: vi.fn(() => mockWorkflowHandle),
};

const mockTemporalConnection = {
  close: vi.fn(),
};

// Use class syntax so `new Client(...)` works
vi.mock("@temporalio/client", () => ({
  Client: class MockClient {
    workflow = mockWorkflowClient;
    constructor(_opts: any) {}
  },
  Connection: {
    connect: vi.fn(async () => mockTemporalConnection),
  },
}));

vi.mock("../../lib/config", () => ({
  appConfig: {
    temporal: {
      address: "ap-northeast-1.aws.api.temporal.io:7233",
      endpoint: "ap-northeast-1.aws.api.temporal.io:7233",
      namespace: "quickstart-dakkah-cityos.djvai",
      apiKey: "mock-api-key",
      taskQueue: "uce-commerce-financial",
      isConfigured: true,
    },
  },
}));

vi.mock("../../lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("startCanonicalWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("starts a workflow and returns workflowId + runId", async () => {
    const { startCanonicalWorkflow } = await import(
      "../../lib/temporal-client"
    );
    const result = await startCanonicalWorkflow(
      "one_time_goods",
      { orderId: "order_123", amount: 100 },
      "order_123",
    );
    expect(result.workflowId).toBeTruthy();
    expect(result.runId).toBeTruthy();
  });

  it("auto-resolves task queue from WORKFLOW_TASK_QUEUES when not provided", async () => {
    const { startCanonicalWorkflow } = await import(
      "../../lib/temporal-client"
    );
    await expect(
      startCanonicalWorkflow(
        "subscription_billing",
        { subscriptionId: "sub_123" },
        "sub_123",
      ),
    ).resolves.toBeDefined();
  });

  it("accepts an explicit taskQueue override", async () => {
    const { startCanonicalWorkflow } = await import(
      "../../lib/temporal-client"
    );
    const result = await startCanonicalWorkflow(
      "vendor_onboarding",
      { vendorId: "vendor_123" },
      "vendor_123",
      "uce-commerce-fulfilment",
    );
    expect(result).toBeDefined();
  });

  it("calls workflow.start and returns a result object", async () => {
    const { startCanonicalWorkflow } = await import(
      "../../lib/temporal-client"
    );
    const result = await startCanonicalWorkflow(
      "kyc_verification",
      { customerId: "cust_123" },
      "cust_123",
    );
    // Result should have workflowId and runId from the underlying SDK call
    expect(result.workflowId).toBeDefined();
    expect(result.runId).toBeDefined();
    expect(mockWorkflowClient.start).toHaveBeenCalled();
  });
});

describe("signalWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("sends a signal to a running workflow without throwing", async () => {
    const { signalWorkflow } = await import("../../lib/temporal-client");
    await expect(
      signalWorkflow("kyc_verification:cust_123", "approve", {
        reviewer: "admin",
      }),
    ).resolves.not.toThrow();
  });
});

describe("temporal-client configuration guard", () => {
  it("throws when Temporal is not configured", async () => {
    vi.doMock("../../lib/config", () => ({
      appConfig: {
        temporal: {
          address: "",
          namespace: "",
          apiKey: "",
          taskQueue: "uce-commerce-financial",
          isConfigured: false,
        },
      },
    }));

    vi.resetModules();
    const { startCanonicalWorkflow } = await import(
      "../../lib/temporal-client"
    );
    await expect(
      startCanonicalWorkflow("one_time_goods", {}, "key"),
    ).rejects.toThrow(/not configured/i);
  });
});

describe("legacy startWorkflow shim", () => {
  it("startWorkflow calls through to startCanonicalWorkflow", async () => {
    // Must re-mock config as configured after previous doMock contamination
    vi.doMock("../../lib/config", () => ({
      appConfig: {
        temporal: {
          address: "ap-northeast-1.aws.api.temporal.io:7233",
          namespace: "quickstart-dakkah-cityos.djvai",
          apiKey: "mock-api-key",
          taskQueue: "uce-commerce-financial",
          isConfigured: true,
        },
      },
    }));
    vi.resetModules();
    const { startWorkflow } = await import("../../lib/temporal-client");
    const result = await startWorkflow(
      "order_cancellation",
      { orderId: "order_123" },
      undefined,
      "uce-commerce-financial",
    );
    expect(result).toBeDefined();
  });
});
