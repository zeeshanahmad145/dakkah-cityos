/**
 * Event Dispatcher — Unit Tests
 *
 * Tests the EVENT_WORKFLOW_MAP: verifies all 60+ events map to
 * valid canonical workflow function names and UCE task queues.
 *
 * Run: pnpm --filter backend test:unit
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock temporal-client so we don't need Temporal running
vi.mock("../../lib/temporal-client", () => ({
  startCanonicalWorkflow: vi.fn(
    async (fn: string, params: any, key: string, queue?: string) => ({
      workflowId: `${fn}:${key}`,
      runId: "mock-run-id",
    }),
  ),
  signalWorkflow: vi.fn(async () => ({})),
}));

vi.mock("../../lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

const CANONICAL_WORKFLOW_FNS = new Set([
  "one_time_goods",
  "auction_settlement",
  "milestone_escrow",
  "on_demand_dispatch",
  "subscription_billing",
  "usage_metering",
  "booking_service",
  "trade_in_valuation",
  "order_cancellation",
  "refund_compensation",
  "payout_processing",
  "fulfillment_tracking",
  "kyc_verification",
  "vendor_onboarding",
  "customer_onboarding",
]);

const VALID_TASK_QUEUES = new Set([
  "uce-commerce-financial",
  "uce-commerce-dispatch",
  "uce-commerce-recurring",
  "uce-commerce-fulfilment",
]);

describe("Event Dispatcher — getWorkflowForEvent", () => {
  it("maps order.placed to one_time_goods on financial queue", async () => {
    const { getWorkflowForEvent } = await import("../../lib/event-dispatcher");
    const mapping = getWorkflowForEvent("order.placed");
    expect(mapping).not.toBeNull();
    expect(mapping!.workflowFn).toBe("one_time_goods");
    expect(mapping!.taskQueue).toBe("uce-commerce-financial");
  });

  it("maps order.cancelled to order_cancellation on financial queue", async () => {
    const { getWorkflowForEvent } = await import("../../lib/event-dispatcher");
    const mapping = getWorkflowForEvent("order.cancelled");
    expect(mapping!.workflowFn).toBe("order_cancellation");
    expect(mapping!.taskQueue).toBe("uce-commerce-financial");
  });

  it("maps refund.requested to refund_compensation", async () => {
    const { getWorkflowForEvent } = await import("../../lib/event-dispatcher");
    const mapping = getWorkflowForEvent("refund.requested");
    expect(mapping!.workflowFn).toBe("refund_compensation");
  });

  it("maps payout.initiated to payout_processing", async () => {
    const { getWorkflowForEvent } = await import("../../lib/event-dispatcher");
    const mapping = getWorkflowForEvent("payout.initiated");
    expect(mapping!.workflowFn).toBe("payout_processing");
    expect(mapping!.taskQueue).toBe("uce-commerce-financial");
  });

  it("maps fulfillment.shipped to fulfillment_tracking on dispatch queue", async () => {
    const { getWorkflowForEvent } = await import("../../lib/event-dispatcher");
    const mapping = getWorkflowForEvent("fulfillment.shipped");
    expect(mapping!.workflowFn).toBe("fulfillment_tracking");
    expect(mapping!.taskQueue).toBe("uce-commerce-dispatch");
  });

  it("maps fulfillment.created to on_demand_dispatch", async () => {
    const { getWorkflowForEvent } = await import("../../lib/event-dispatcher");
    const mapping = getWorkflowForEvent("fulfillment.created");
    expect(mapping!.workflowFn).toBe("on_demand_dispatch");
    expect(mapping!.taskQueue).toBe("uce-commerce-dispatch");
  });

  it("maps subscription.* events to subscription_billing on recurring queue", async () => {
    const { getWorkflowForEvent } = await import("../../lib/event-dispatcher");
    const subEvents = [
      "subscription.created",
      "subscription.cancelled",
      "subscription.payment_failed",
      "subscription.renewal_upcoming",
    ];
    for (const evt of subEvents) {
      const mapping = getWorkflowForEvent(evt);
      expect(mapping, `Expected mapping for ${evt}`).not.toBeNull();
      expect(mapping!.workflowFn).toBe("subscription_billing");
      expect(mapping!.taskQueue).toBe("uce-commerce-recurring");
    }
  });

  it("maps booking.* events to booking_service on fulfilment queue", async () => {
    const { getWorkflowForEvent } = await import("../../lib/event-dispatcher");
    const bookingEvents = ["booking.created", "booking.confirmed"];
    for (const evt of bookingEvents) {
      const mapping = getWorkflowForEvent(evt);
      expect(mapping!.workflowFn).toBe("booking_service");
      expect(mapping!.taskQueue).toBe("uce-commerce-fulfilment");
    }
  });

  it("maps kyc.requested to kyc_verification", async () => {
    const { getWorkflowForEvent } = await import("../../lib/event-dispatcher");
    const mapping = getWorkflowForEvent("kyc.requested");
    expect(mapping!.workflowFn).toBe("kyc_verification");
    expect(mapping!.taskQueue).toBe("uce-commerce-fulfilment");
  });

  it("maps vendor.registered to vendor_onboarding", async () => {
    const { getWorkflowForEvent } = await import("../../lib/event-dispatcher");
    const mapping = getWorkflowForEvent("vendor.registered");
    expect(mapping!.workflowFn).toBe("vendor_onboarding");
    expect(mapping!.taskQueue).toBe("uce-commerce-fulfilment");
  });

  it("maps customer.created to customer_onboarding", async () => {
    const { getWorkflowForEvent } = await import("../../lib/event-dispatcher");
    const mapping = getWorkflowForEvent("customer.created");
    expect(mapping!.workflowFn).toBe("customer_onboarding");
    expect(mapping!.taskQueue).toBe("uce-commerce-fulfilment");
  });

  it("returns null for unknown events", async () => {
    const { getWorkflowForEvent } = await import("../../lib/event-dispatcher");
    expect(getWorkflowForEvent("nonexistent.event")).toBeNull();
    expect(getWorkflowForEvent("")).toBeNull();
  });
});

describe("Event Dispatcher — all mapped events use valid canonical workflows and queues", () => {
  it("every mapped event points to a canonical workflowFn", async () => {
    const { getAllMappedEvents, getWorkflowForEvent } = await import(
      "../../lib/event-dispatcher"
    );
    const events = getAllMappedEvents();
    expect(events.length).toBeGreaterThan(40); // we have 60+ events

    for (const evt of events) {
      const mapping = getWorkflowForEvent(evt);
      expect(mapping, `No mapping for event "${evt}"`).not.toBeNull();
      expect(
        CANONICAL_WORKFLOW_FNS.has(mapping!.workflowFn),
        `Event "${evt}" maps to unknown workflow "${mapping!.workflowFn}"`,
      ).toBe(true);
      expect(
        VALID_TASK_QUEUES.has(mapping!.taskQueue),
        `Event "${evt}" uses invalid task queue "${mapping!.taskQueue}"`,
      ).toBe(true);
    }
  });

  it("every mapping has an idempotencyKey function", async () => {
    const { getAllMappedEvents, getWorkflowForEvent } = await import(
      "../../lib/event-dispatcher"
    );
    const events = getAllMappedEvents();
    for (const evt of events) {
      const mapping = getWorkflowForEvent(evt)!;
      expect(typeof mapping.idempotencyKey).toBe("function");
      // Key should return a non-empty string for a sample payload
      const key = mapping.idempotencyKey({
        id: "test_123",
        order_id: "order_abc",
      });
      expect(typeof key).toBe("string");
      expect(key.length).toBeGreaterThan(0);
    }
  });
});

describe("Event Dispatcher — dispatchEventToTemporal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dispatches a known event and returns dispatched=true", async () => {
    const { dispatchEventToTemporal } = await import(
      "../../lib/event-dispatcher"
    );
    const result = await dispatchEventToTemporal("order.placed", {
      id: "order_123",
    });
    expect(result.dispatched).toBe(true);
    expect(result.runId).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  it("returns dispatched=false for unknown event", async () => {
    const { dispatchEventToTemporal } = await import(
      "../../lib/event-dispatcher"
    );
    const result = await dispatchEventToTemporal("unknown.event", { id: "x" });
    expect(result.dispatched).toBe(false);
    expect(result.error).toContain("No workflow mapped");
  });

  it("passes the correct workflowFn to startCanonicalWorkflow", async () => {
    const { startCanonicalWorkflow } = await import(
      "../../lib/temporal-client"
    );
    const { dispatchEventToTemporal } = await import(
      "../../lib/event-dispatcher"
    );

    await dispatchEventToTemporal("vendor.registered", { id: "vendor_abc" });
    expect(startCanonicalWorkflow).toHaveBeenCalledWith(
      "vendor_onboarding",
      expect.objectContaining({ _eventType: "vendor.registered" }),
      expect.any(String),
      "uce-commerce-fulfilment",
    );
  });

  it("includes _eventType in workflow params", async () => {
    const { startCanonicalWorkflow } = await import(
      "../../lib/temporal-client"
    );
    const { dispatchEventToTemporal } = await import(
      "../../lib/event-dispatcher"
    );

    await dispatchEventToTemporal("customer.created", { id: "cust_xyz" });
    const callArgs = (startCanonicalWorkflow as any).mock.calls[0];
    expect(callArgs[1]._eventType).toBe("customer.created");
  });

  it("handles errors from startCanonicalWorkflow gracefully", async () => {
    const { startCanonicalWorkflow } = await import(
      "../../lib/temporal-client"
    );
    vi.mocked(startCanonicalWorkflow).mockRejectedValueOnce(
      new Error("Connection refused"),
    );

    const { dispatchEventToTemporal } = await import(
      "../../lib/event-dispatcher"
    );
    const result = await dispatchEventToTemporal("order.placed", {
      id: "order_err",
    });
    expect(result.dispatched).toBe(false);
    expect(result.error).toContain("Connection refused");
  });
});

describe("Event → Queue routing coverage", () => {
  it("financial queue handles: order, payment, refund, payout, dispute, auction, invoice", async () => {
    const { getWorkflowForEvent } = await import("../../lib/event-dispatcher");
    const financialEvents = [
      "order.placed",
      "order.cancelled",
      "payment.initiated",
      "payment.completed",
      "refund.requested",
      "return.initiated",
      "payout.initiated",
      "payout.failed",
      "payout.completed",
      "dispute.opened",
      "auction.started",
      "invoice.created",
      "invoice.overdue",
    ];
    for (const evt of financialEvents) {
      expect(getWorkflowForEvent(evt)?.taskQueue).toBe(
        "uce-commerce-financial",
      );
    }
  });

  it("dispatch queue handles: fulfillment and restaurant-order events", async () => {
    const { getWorkflowForEvent } = await import("../../lib/event-dispatcher");
    const dispatchEvents = [
      "fulfillment.created",
      "fulfillment.shipped",
      "fulfillment.delivered",
      "vendor_order.shipped",
      "restaurant-order.placed",
    ];
    for (const evt of dispatchEvents) {
      expect(getWorkflowForEvent(evt)?.taskQueue).toBe("uce-commerce-dispatch");
    }
  });

  it("recurring queue handles: subscription and usage metering events", async () => {
    const { getWorkflowForEvent } = await import("../../lib/event-dispatcher");
    const recurringEvents = [
      "subscription.created",
      "subscription.cancelled",
      "subscription.plan_changed",
      "subscription.paused",
      "subscription.resumed",
      "product.created",
      "product.updated",
    ];
    for (const evt of recurringEvents) {
      expect(getWorkflowForEvent(evt)?.taskQueue).toBe(
        "uce-commerce-recurring",
      );
    }
  });

  it("fulfilment queue handles: booking, kyc, vendor, customer events", async () => {
    const { getWorkflowForEvent } = await import("../../lib/event-dispatcher");
    const fulfilmentEvents = [
      "booking.created",
      "booking.confirmed",
      "kyc.requested",
      "kyc.completed",
      "vendor.registered",
      "vendor.created",
      "vendor.approved",
      "customer.created",
      "customer.updated",
      "tenant.provisioned",
    ];
    for (const evt of fulfilmentEvents) {
      expect(getWorkflowForEvent(evt)?.taskQueue).toBe(
        "uce-commerce-fulfilment",
      );
    }
  });
});
